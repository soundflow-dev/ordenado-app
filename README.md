# O meu ordenado

Web app em Node.js, Express e SQLite para registar horas, ordenados e utilizadores com confirmacao por email.

## Desenvolvimento local

```bash
npm install
npm start
```

Por defeito a app usa a porta `8092`.

## Docker

```bash
docker compose up -d --build
```

## Configuracao

Copia `.env.example` para `.env` e preenche:

```env
PORT=8092
JWT_SECRET=gera_uma_string_aleatoria_longa
RESEND_API_KEY=re_xxxxxxxx
FROM_EMAIL=noreply@jarvisserver.one
APP_URL=https://ordenadoapp.jarvisserver.one
DB_PATH=/data/ordenado.db
```

Nunca publiques o ficheiro `.env`.

## Instalar no Unraid

Tens duas opcoes:

- Template Unraid: `templates/ordenado-app.xml`
- Docker Compose a partir do GitHub

Guia passo a passo:

```text
INSTALL_UNRAID.md
```

Template direto:

```text
https://raw.githubusercontent.com/soundflow-dev/ordenado-app/main/templates/ordenado-app.xml
```
