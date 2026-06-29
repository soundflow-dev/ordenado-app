# Instalar no Unraid a partir do GitHub

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

## 6. Criar o ficheiro `.env`

O `.env` tem segredos, por isso nao vai para o GitHub. Tens de o criar diretamente no Unraid.

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
