# Instalar no Unraid

Tens duas formas de instalar:

- **Opcao A - Template Unraid**, mais simples para instalar pela interface.
- **Opcao B - GitHub + Docker Compose**, a forma manual que ja existia.

## Opcao A - Instalar por template Unraid

Esta opcao usa a imagem Docker publicada em:

```text
ghcr.io/soundflow-dev/ordenado-app:latest
```

O template esta neste ficheiro:

```text
https://raw.githubusercontent.com/soundflow-dev/ordenado-app/main/templates/ordenado-app.xml
```

### 1. Criar o template no Unraid

No Unraid, abre o terminal ou entra por SSH e executa:

```bash
mkdir -p /boot/config/plugins/dockerMan/templates-user
curl -L https://raw.githubusercontent.com/soundflow-dev/ordenado-app/main/templates/ordenado-app.xml \
  -o /boot/config/plugins/dockerMan/templates-user/my-ordenado-app.xml
```

### 2. Abrir o template

1. Vai a `Docker`.
2. Clica em `Add Container`.
3. No campo `Template`, escolhe `ordenado-app`.

Se nao aparecer logo, recarrega a pagina do Unraid.

### 3. Preencher os campos obrigatorios

Preenche:

```text
WebUI Port: 8092
Data: /mnt/user/appdata/ordenado
APP_URL: https://ordenadoapp.jarvisserver.one
FROM_EMAIL: noreply@jarvisserver.one
JWT_SECRET: uma_chave_longa_aleatoria
RESEND_API_KEY: a_tua_chave_do_resend
```

Para gerar `JWT_SECRET`, podes usar no terminal:

```bash
openssl rand -hex 32
```

### 4. Instalar

Clica em `Apply`.

Depois testa:

```text
http://IP_DO_UNRAID:8092
```

ou:

```text
https://ordenadoapp.jarvisserver.one
```

### 5. Atualizar pela interface

Quando eu publicar nova imagem, no Unraid basta ires a `Docker` e clicar em `Check for Updates`.

Se aparecer update para `ordenado-app`, aplica.

---

## Opcao B - Instalar a partir do GitHub com Docker Compose

Este guia assume que a app vai ficar em:

- Pasta da app: `/mnt/user/appdata/ordenado-app`
- Base de dados SQLite: `/mnt/user/appdata/ordenado/ordenado.db`
- Porta interna/externa: `8092`
- URL publica: `https://ordenadoapp.jarvisserver.one`
- Repositorio GitHub: `https://github.com/soundflow-dev/ordenado-app`

## 1. Preparar o Unraid

1. Entra no Unraid pelo browser.
2. Vai a `Apps`.
3. Se ainda nao tiveres, instala o plugin `Docker Compose Manager`.
4. Confirma que o Docker esta ativo em `Settings > Docker`.

## 2. Entrar no Unraid por SSH

No teu computador, abre o Terminal e entra no servidor:

```bash
ssh root@IP_DO_UNRAID
```

Substitui `IP_DO_UNRAID` pelo IP real do teu Unraid. Exemplo:

```bash
ssh root@192.168.1.50
```

## 3. Confirmar se o Git existe

No Unraid:

```bash
git --version
```

Se aparecer uma versao, esta tudo bem.

Se disser que o comando nao existe:

1. Vai a `Apps` no Unraid.
2. Instala `NerdTools`.
3. Abre `Settings > NerdTools`.
4. Ativa o pacote `git`.
5. Volta ao terminal e testa outra vez:

```bash
git --version
```

## 4. Descarregar a app do GitHub

No Unraid:

```bash
cd /mnt/user/appdata
git clone https://github.com/soundflow-dev/ordenado-app.git
```

Isto cria a pasta:

```text
/mnt/user/appdata/ordenado-app
```

## 5. Criar a pasta onde fica a base de dados

No Unraid:

```bash
mkdir -p /mnt/user/appdata/ordenado
```

A base de dados vai ficar aqui:

```text
/mnt/user/appdata/ordenado/ordenado.db
```

## 6. Copiar ou criar o ficheiro `.env`

O `.env` tem segredos, por isso nao vai para o GitHub.

Se ja tens o `.env` pronto no Mac, copia-o diretamente para o Unraid:

```bash
scp /Users/brunosilva/ordenado-app/.env root@IP_DO_UNRAID:/mnt/user/appdata/ordenado-app/.env
```

Exemplo:

```bash
scp /Users/brunosilva/ordenado-app/.env root@192.168.1.50:/mnt/user/appdata/ordenado-app/.env
```

Depois, no Unraid:

```bash
chmod 600 /mnt/user/appdata/ordenado-app/.env
```

Se preferires criar manualmente, faz assim.

No Unraid:

```bash
cd /mnt/user/appdata/ordenado-app
nano .env
```

Cola isto dentro do ficheiro:

```env
PORT=8092
JWT_SECRET=troca_isto_por_uma_frase_muito_grande_e_secreta
RESEND_API_KEY=re_a_tua_chave_resend
FROM_EMAIL=noreply@jarvisserver.one
APP_URL=https://ordenadoapp.jarvisserver.one
DB_PATH=/data/ordenado.db
```

Notas importantes:

- `JWT_SECRET` deve ser uma frase grande e aleatoria.
- `RESEND_API_KEY` deve ser a chave real do Resend.
- `APP_URL` deve ser o dominio publico final.

Para guardar no nano:

1. Carrega em `Ctrl + O`
2. Carrega em `Enter`
3. Carrega em `Ctrl + X`

Protege o ficheiro:

```bash
chmod 600 .env
```

## 7. Arrancar a app

No Unraid:

```bash
cd /mnt/user/appdata/ordenado-app
docker compose up -d --build
```

## 8. Confirmar que esta a correr

Ver containers:

```bash
docker compose ps
```

Testar a app:

```bash
curl http://localhost:8092/health
```

Deve responder:

```json
{"ok":true}
```

## 9. Abrir no browser dentro da tua rede

No browser do teu computador:

```text
http://IP_DO_UNRAID:8092
```

Exemplo:

```text
http://192.168.1.50:8092
```

## 10. Colocar online com o dominio

Para os emails de confirmacao funcionarem bem, a app deve estar acessivel no dominio configurado:

```text
https://ordenadoapp.jarvisserver.one
```

Tens duas formas simples.

## 11. Opcao recomendada: Cloudflare Tunnel

Esta e a opcao mais limpa para Unraid porque nao exige abrir portas no router.

1. No Unraid, vai a `Apps`.
2. Instala `cloudflared`.
3. Vai ao painel da Cloudflare.
4. Abre `Zero Trust`.
5. Vai a `Networks > Tunnels`.
6. Cria um tunnel novo.
7. Liga esse tunnel ao teu container `cloudflared` no Unraid.
8. Cria um hostname publico:

```text
Subdomain: ordenadoapp
Domain: jarvisserver.one
Service type: HTTP
Service URL: http://IP_DO_UNRAID:8092
```

Depois testa:

```text
https://ordenadoapp.jarvisserver.one
```

## 12. Opcao alternativa: Nginx Proxy Manager

Usa esta opcao se ja tiveres reverse proxy no Unraid.

1. Instala `Nginx Proxy Manager`.
2. Abre o painel do Nginx Proxy Manager.
3. Vai a `Proxy Hosts`.
4. Clica em `Add Proxy Host`.
5. Preenche:

```text
Domain Names: ordenadoapp.jarvisserver.one
Scheme: http
Forward Hostname/IP: IP_DO_UNRAID
Forward Port: 8092
```

6. Vai ao separador `SSL`.
7. Ativa `Request a new SSL Certificate`.
8. Ativa `Force SSL`.
9. Guarda.

Na Cloudflare, cria um registo DNS para `ordenadoapp` a apontar para o teu servidor.

## 13. Atualizar a app no futuro

Quando eu fizer alteracoes e enviar para o GitHub, no Unraid basta fazer:

```bash
cd /mnt/user/appdata/ordenado-app
git pull
docker compose up -d --build
```

## 14. Ver logs se algo correr mal

```bash
cd /mnt/user/appdata/ordenado-app
docker compose logs -f
```

## 15. Parar a app

```bash
cd /mnt/user/appdata/ordenado-app
docker compose down
```

## 16. O que nunca deves apagar sem backup

Nao apagues esta pasta se quiseres manter os dados:

```text
/mnt/user/appdata/ordenado
```

E especialmente este ficheiro:

```text
/mnt/user/appdata/ordenado/ordenado.db
```
