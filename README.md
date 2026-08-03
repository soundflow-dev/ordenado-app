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

## Instalar no Unraid por template

Esta e a forma mais simples de reinstalar a app no Unraid.

### 1. Entrar no terminal do Unraid

No Unraid, abre o terminal no canto superior direito, ou entra por SSH:

```bash
ssh root@IP_DO_UNRAID
```

Substitui `IP_DO_UNRAID` pelo IP do teu servidor.

### 2. Instalar o template

Cola este comando no terminal do Unraid:

```bash
mkdir -p /boot/config/plugins/dockerMan/templates-user && \
curl -L \
  -o /boot/config/plugins/dockerMan/templates-user/my-ordenado-app.xml \
  https://raw.githubusercontent.com/soundflow-dev/ordenado-app/main/templates/ordenado-app.xml
```

### 3. Criar a app no Unraid

1. Vai a `Docker`.
2. Clica em `Add Container`.
3. No campo `Template`, escolhe `ordenado-app` ou `my-ordenado-app`.
4. Se nao aparecer, recarrega a pagina do Unraid.

### 4. Preencher os campos

Preenche assim:

```text
WebUI Port: 8092
Data: /mnt/user/appdata/ordenado
APP_URL: https://ordenadoapp.jarvisserver.one
FROM_EMAIL: noreply@jarvisserver.one
JWT_SECRET: coloca aqui uma chave longa gerada por ti
RESEND_API_KEY: coloca aqui a chave API do Resend
```

Para gerar a `JWT_SECRET`, usa este comando no terminal do Unraid:

```bash
openssl rand -hex 32
```

`JWT_SECRET` nao vem do Resend. E apenas uma chave secreta da propria app.

`RESEND_API_KEY` vem do Resend e comeca normalmente por `re_`.

### 5. Instalar

Clica em `Apply`.

Depois abre:

```text
http://IP_DO_UNRAID:8092
```

Se usares Cloudflare Tunnel, abre:

```text
https://ordenadoapp.jarvisserver.one
```

Para confirmar se a app esta viva:

```text
http://IP_DO_UNRAID:8092/health
```

Deve aparecer:

```json
{"ok":true}
```

## Guia completo

O guia mais detalhado esta em `INSTALL_UNRAID.md`.
