require('dotenv').config();

const crypto = require('crypto');
const path = require('path');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const db = require('./database');
const { sendMail, activationEmail, resetEmail } = require('./email');

const app = express();
const PORT = Number(process.env.PORT || 8092);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const APP_URL = (process.env.APP_URL || `http://localhost:${PORT}`).replace(/\/$/, '');

app.set('trust proxy', 1);
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const token = () => crypto.randomBytes(32).toString('hex');
const normEmail = (email) => String(email || '').trim().toLowerCase();

function sign(user, rememberMe) {
  return jwt.sign({ id: user.id, email: user.email, admin: !!user.is_admin }, JWT_SECRET, {
    expiresIn: rememberMe ? '30d' : '24h'
  });
}

function isSecureRequest(req) {
  return req.secure || String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https';
}

function setSession(req, res, user, rememberMe) {
  res.cookie('session', sign(user, rememberMe), {
    httpOnly: true,
    secure: isSecureRequest(req),
    sameSite: 'lax',
    maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
  });
}

function auth(req, res, next) {
  try {
    const decoded = jwt.verify(req.cookies.session || '', JWT_SECRET);
    const user = db.prepare('SELECT id, name, email, verified, is_admin FROM users WHERE id = ?').get(decoded.id);
    if (!user || !user.verified) return res.status(401).json({ error: 'unauthorized' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'unauthorized' });
  }
}

function pdfEscape(text) {
  return String(text || '')
    .replace(/[\\()]/g, '\\$&')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');
}

function makeSimplePdf(lines) {
  const safeLines = lines.flatMap((line) => {
    const text = String(line || '');
    const chunks = [];
    for (let i = 0; i < text.length; i += 92) chunks.push(text.slice(i, i + 92));
    return chunks.length ? chunks : [''];
  });
  let y = 800;
  const pages = [];
  let current = [];
  safeLines.forEach((line) => {
    if (y < 52) {
      pages.push(current);
      current = [];
      y = 800;
    }
    current.push({ y, text: line });
    y -= 16;
  });
  pages.push(current);

  const objects = [''];
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  objects.push('<< /Type /Pages /Kids [' + pages.map((_, i) => `${3 + i * 2} 0 R`).join(' ') + `] /Count ${pages.length} >>`);
  pages.forEach((page, i) => {
    const pageObj = 3 + i * 2;
    const contentObj = pageObj + 1;
    objects[pageObj] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >> >> /Contents ${contentObj} 0 R >>`;
    const body = ['BT', '/F1 10 Tf', '50 800 Td'];
    let lastY = 800;
    page.forEach((row) => {
      body.push(`0 ${row.y - lastY} Td (${pdfEscape(row.text)}) Tj`);
      lastY = row.y;
    });
    body.push('ET');
    const stream = body.join('\n');
    objects[contentObj] = `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`;
  });

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (let i = 1; i < objects.length; i++) {
    offsets[i] = Buffer.byteLength(pdf);
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < objects.length; i++) pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, 'latin1');
}

function hourBankPdfBody(data) {
  const categories = ['p25', 'p50', 'p100'];
  const label = (key) => ({ p25: 'HS +25%', p50: 'HS +50%', p100: 'HS +100%' })[key] || key;
  const title = data.lang === 'fr' ? "Extrait banque d'heures" : 'Extrato do banco de horas';
  const lines = [
    title,
    `Nome: ${data.name || ''}`,
    `Periodo: ${data.from || ''} a ${data.to || ''}`,
    '',
    'Saldo inicial:',
    ...categories.map((k) => `${label(k)}: ${Number(data.opening?.[k] || 0).toFixed(2)} h`),
    '',
    'Movimentos:'
  ];
  (Array.isArray(data.entries) ? data.entries : []).forEach((e) => {
    lines.push(`${e.date || ''} | ${e.type || ''} | ${e.category || ''} | ${Number(e.hours || 0).toFixed(2)} h | ${e.note || ''}`);
  });
  if (!data.entries?.length) lines.push('Sem movimentos no periodo.');
  lines.push('', 'Saldo final:', ...categories.map((k) => `${label(k)}: ${Number(data.closing?.[k] || 0).toFixed(2)} h`));
  return lines;
}

app.post('/api/register', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = normEmail(req.body.email);
  const password = String(req.body.password || '');
  if (!name || !email || password.length < 8) return res.status(400).json({ error: 'invalid_input' });

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return res.status(409).json({ error: 'email_exists' });

  const count = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  const verificationToken = token();
  const hash = await bcrypt.hash(password, 12);
  const info = db.prepare(`
    INSERT INTO users (name, email, password_hash, verified, is_admin, verification_token)
    VALUES (?, ?, ?, 0, ?, ?)
  `).run(name, email, hash, count === 0 ? 1 : 0, verificationToken);

  const link = `${APP_URL}/api/verify-email/${verificationToken}`;
  await sendMail({ to: email, ...activationEmail(name, link) });
  res.status(201).json({ ok: true, id: info.lastInsertRowid, emailSent: true });
});

app.get('/api/verify-email/:token', (req, res) => {
  const user = db.prepare('SELECT id FROM users WHERE verification_token = ?').get(req.params.token);
  if (!user) return res.redirect('/?verified=invalid');
  db.prepare('UPDATE users SET verified = 1, verification_token = NULL WHERE id = ?').run(user.id);
  res.redirect('/?verified=ok');
});

app.post('/api/login', async (req, res) => {
  const email = normEmail(req.body.email);
  const password = String(req.body.password || '');
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }
  if (!user.verified) return res.status(403).json({ error: 'not_verified' });
  setSession(req, res, user, !!req.body.rememberMe);
  res.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, isAdmin: !!user.is_admin } });
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('session', { httpOnly: true, secure: isSecureRequest(req), sameSite: 'lax' });
  res.json({ ok: true });
});

app.post('/api/forgot-password', async (req, res) => {
  const email = normEmail(req.body.email);
  const user = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(email);
  if (user) {
    const resetToken = token();
    const expires = Date.now() + 60 * 60 * 1000;
    db.prepare('UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?').run(resetToken, expires, user.id);
    const link = `${APP_URL}/?reset=${resetToken}`;
    await sendMail({ to: user.email, ...resetEmail(user.name, link) });
  }
  res.json({ ok: true });
});

app.post('/api/reset-password', async (req, res) => {
  const resetToken = String(req.body.token || '');
  const newPassword = String(req.body.newPassword || '');
  if (newPassword.length < 8) return res.status(400).json({ error: 'weak_password' });
  const user = db.prepare('SELECT id FROM users WHERE reset_token = ? AND reset_expires > ?').get(resetToken, Date.now());
  if (!user) return res.status(400).json({ error: 'invalid_or_expired' });
  const hash = await bcrypt.hash(newPassword, 12);
  db.prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?').run(hash, user.id);
  res.json({ ok: true });
});

app.get('/api/me', auth, (req, res) => {
  res.json({ user: { id: req.user.id, name: req.user.name, email: req.user.email, isAdmin: !!req.user.is_admin } });
});

app.post('/api/test-email', auth, async (req, res) => {
  const to = normEmail(req.body.to || req.user.email);
  if (!to) return res.status(400).json({ error: 'invalid_email' });
  await sendMail({
    to,
    subject: 'Test Mon salaire',
    text: `Bonjour ${req.user.name}, l'envoi d'email Mon salaire fonctionne.`,
    html: `<p>Bonjour ${req.user.name},</p><p>L'envoi d'email Mon salaire fonctionne.</p>`
  });
  res.json({ ok: true });
});

app.get('/api/data', auth, (req, res) => {
  const row = db.prepare('SELECT data_json, updated_at FROM user_data WHERE user_id = ?').get(req.user.id);
  res.json(row ? JSON.parse(row.data_json) : null);
});

app.post('/api/data', auth, (req, res) => {
  const data = JSON.stringify(req.body || {});
  db.prepare(`
    INSERT INTO user_data (user_id, data_json, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET data_json = excluded.data_json, updated_at = CURRENT_TIMESTAMP
  `).run(req.user.id, data);
  res.json({ ok: true });
});

app.post('/api/hour-bank/report', auth, async (req, res) => {
  const toEmail = normEmail(req.body.toEmail);
  const title = req.body.lang === 'fr' ? "Extrait banque d'heures" : 'Extrato do banco de horas';
  const pdf = makeSimplePdf(hourBankPdfBody({ ...req.body, name: req.body.name || req.user.name }));

  if (req.body.sendEmail) {
    if (!toEmail) return res.status(400).json({ error: 'invalid_email' });
    await sendMail({
      to: toEmail,
      subject: `${title} - ${req.body.from || ''} / ${req.body.to || ''}`,
      text: 'Segue em anexo o extrato do banco de horas em PDF.',
      html: '<p>Segue em anexo o extrato do banco de horas em PDF.</p>',
      attachments: [{ filename: 'banco-horas.pdf', content: pdf, contentType: 'application/pdf' }]
    });
    return res.json({ ok: true });
  }

  res
    .type('application/pdf')
    .set('Content-Disposition', 'attachment; filename="banco-horas.pdf"')
    .send(pdf);
});

app.get('/app', auth, (req, res) => res.sendFile(path.join(__dirname, 'public', 'app.html')));
app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`O meu ordenado listening on ${PORT}`));
