# Email setup

The app sends account activation and password reset emails with Resend SMTP.

Use this sender:

```env
FROM_EMAIL=noreply@jarvisserver.one
```

In Resend:

1. Verify the domain `jarvisserver.one`.
2. Add the DNS records Resend gives you in Cloudflare.
3. Create an API key.
4. Put it in `.env` or in the Unraid template:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
APP_URL=https://ordenadoapp.jarvisserver.one
JWT_SECRET=change_this_to_a_long_random_string
```

SMTP values used by the app:

```text
Host: smtp.resend.com
Port: 465
Username: resend
Password: RESEND_API_KEY
```

After changing env vars, rebuild/restart the container.
