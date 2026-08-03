# O meu ordenado

Web app em Node.js, Express e SQLite para registar horas, ordenados e utilizadores com confirmacao por email.

## Desenvolvimento local

```bash
npm install
npm start
```

Por defeito a app usa a porta `8092`.

## Administrador

O primeiro utilizador registado na app fica automaticamente administrador.

Depois de entrar, esse utilizador ve um botao `Utilizadores`, onde pode gerir contas registadas. Utilizadores normais nao veem esse botao e tambem nao conseguem aceder aos endpoints de administracao.

## Instalar por Docker Compose

Usa esta opcao se quiseres instalar manualmente a partir do GitHub.

### 1. Entrar no servidor

Entra por SSH no servidor onde queres instalar a app:

```bash
ssh root@IP_DO_SERVIDOR
```

Substitui `IP_DO_SERVIDOR` pelo IP real do servidor.

### 2. Descarregar a app

No servidor, cola:

```bash
cd /mnt/user/appdata
git clone https://github.com/soundflow-dev/ordenado-app.git
cd /mnt/user/appdata/ordenado-app
```

Se nao estiveres no Unraid, podes usar outra pasta. O importante e entrares depois na pasta `ordenado-app`.

### 3. Criar a pasta dos dados

No Unraid:

```bash
mkdir -p /mnt/user/appdata/ordenado
```

E nessa pasta que fica a base de dados SQLite.

### 4. Criar o ficheiro `.env`

Ainda dentro da pasta da app:

```bash
nano .env
```

Cola isto, alterando os valores do dominio e do Resend:

```env
PORT=8092
JWT_SECRET=cola_aqui_uma_chave_longa_gerada_por_ti
RESEND_API_KEY=re_a_tua_chave_do_resend
FROM_EMAIL=noreply@teu-dominio.example
APP_URL=https://teu-dominio.example
DB_PATH=/data/ordenado.db
```

Para gerar a `JWT_SECRET`, abre outro terminal ou usa antes:

```bash
openssl rand -hex 32
```

`JWT_SECRET` e uma chave secreta da app. Nao vem do Resend.

`RESEND_API_KEY` e a chave API do Resend e normalmente comeca por `re_`.

Para guardar no `nano`:

1. Carrega em `Ctrl + O`.
2. Carrega em `Enter`.
3. Carrega em `Ctrl + X`.

Depois protege o ficheiro:

```bash
chmod 600 .env
```

### 5. Arrancar a app

```bash
docker compose up -d --build
```

### 6. Testar

```bash
curl http://localhost:8092/health
```

Se estiver tudo bem, deve aparecer:

```json
{"ok":true}
```

Depois abre no browser:

```text
http://IP_DO_SERVIDOR:8092
```

Se tiveres Cloudflare Tunnel configurado, abre o teu dominio publico:

```text
https://teu-dominio.example
```

### 7. Atualizar no futuro

Quando houver alteracoes novas no GitHub:

```bash
cd /mnt/user/appdata/ordenado-app
git pull
docker compose up -d --build
```

## Configuracao

Copia `.env.example` para `.env` e preenche:

```env
PORT=8092
JWT_SECRET=gera_uma_string_aleatoria_longa
RESEND_API_KEY=re_xxxxxxxx
FROM_EMAIL=noreply@teu-dominio.example
APP_URL=https://teu-dominio.example
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
APP_URL: https://teu-dominio.example
FROM_EMAIL: noreply@teu-dominio.example
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

Se usares Cloudflare Tunnel, abre o teu dominio publico:

```text
https://teu-dominio.example
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
