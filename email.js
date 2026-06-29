const nodemailer = require('nodemailer');

const from = process.env.FROM_EMAIL || 'noreply@jarvisserver.one';

function transporter() {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith('re_xxxxx')) return null;
  return nodemailer.createTransport({
    host: 'smtp.resend.com',
    port: 465,
    secure: true,
    auth: {
      user: 'resend',
      pass: process.env.RESEND_API_KEY
    }
  });
}

async function sendMail({ to, subject, html, text }) {
  const tx = transporter();
  if (!tx) {
    console.log(`[email disabled] ${subject}: ${text || html}`);
    return { disabled: true };
  }
  return tx.sendMail({ from, to, subject, html, text });
}

function activationEmail(name, link) {
  return {
    subject: 'Activez votre compte Mon salaire',
    text: `Bonjour ${name}, activez votre compte ici: ${link}`,
    html: `<p>Bonjour ${name},</p><p>Activez votre compte Mon salaire:</p><p><a href="${link}">${link}</a></p>`
  };
}

function resetEmail(name, link) {
  return {
    subject: 'Réinitialisation du mot de passe',
    text: `Bonjour ${name}, réinitialisez votre mot de passe ici: ${link}`,
    html: `<p>Bonjour ${name},</p><p>Réinitialisez votre mot de passe dans l'heure:</p><p><a href="${link}">${link}</a></p>`
  };
}

module.exports = { sendMail, activationEmail, resetEmail };
