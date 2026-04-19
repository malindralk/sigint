# Credential Rotation Procedures

This document provides step-by-step instructions for rotating all secrets used by the SIGINT backend services.

**Location of secrets:** `backend/.env` (gitignored, never committed)

---

## 1. JWT SECRET_KEY

Used for signing access and refresh tokens.

**Impact:** Rotating this key immediately invalidates ALL active user sessions. Users must re-authenticate.

```bash
# 1. Generate a new key
openssl rand -hex 32

# 2. Update backend/.env
SECRET_KEY=<new-value>

# 3. Restart backend
cd backend && docker compose restart backend
```

---

## 2. PostgreSQL Password (DB_PASSWORD)

Used by the backend to connect to PostgreSQL and by Docker Compose to initialise the database.

**Impact:** Backend cannot connect to the database until the new password is applied everywhere.

```bash
# 1. Generate a new password
openssl rand -base64 32

# 2. Change the password inside PostgreSQL
docker exec -it sigint-db psql -U sigint -c "ALTER USER sigint PASSWORD '<new-password>';"

# 3. Update backend/.env (both fields must match)
DB_PASSWORD=<new-password>
DATABASE_URL=postgresql+asyncpg://sigint:<new-password>@localhost:5432/sigint

# 4. Restart services (backend picks up the new env)
cd backend && docker compose restart backend
```

**Note:** The DATABASE_URL in docker-compose.yml uses `${DB_PASSWORD}`, so updating .env is sufficient.

---

## 3. Redis Password (REDIS_PASSWORD)

Used by the Redis container (`--requirepass`) and the backend connection URL.

**Impact:** All cached sessions and rate-limit counters are preserved but inaccessible until all services use the new password.

```bash
# 1. Generate a new password
openssl rand -base64 32

# 2. Update backend/.env (ALL three values must be consistent)
REDIS_PASSWORD=<new-password>
REDIS_URL=redis://:<new-password>@redis:6379/0

# 3. Recreate the Redis container (picks up new --requirepass)
cd backend && docker compose up -d redis

# 4. Restart backend to use new REDIS_URL
docker compose restart backend
```

**CRITICAL:** The current Redis password is a placeholder (`changeme_redis_password_rotate_this`) and MUST be rotated before production use.

---

## 4. Google OAuth Client Secret (GOOGLE_CLIENT_SECRET)

Used for the Google OAuth 2.0 login flow.

**Impact:** OAuth login fails until the new secret is deployed. Existing sessions remain valid until they expire.

```bash
# 1. Go to https://console.cloud.google.com/apis/credentials
# 2. Select the OAuth 2.0 Client ID for this project
# 3. Click "Reset Secret" (or create a new client)
# 4. Copy the new secret

# 5. Update backend/.env
GOOGLE_CLIENT_SECRET=<new-secret>

# 6. If the Client ID also changed:
GOOGLE_CLIENT_ID=<new-client-id>

# 7. Restart backend
cd backend && docker compose restart backend
```

**Reminder:** The authorised redirect URI must remain:
- Production: `https://malindra.com/api/auth/oauth/google/callback`
- Development: `http://localhost:8000/api/auth/oauth/google/callback`

---

## 5. API Keys (Stripe, Resend, LemonSqueezy, etc.)

These are optional integrations. Rotate via each provider's dashboard.

| Key | Provider Dashboard | .env Variable |
|-----|-------------------|---------------|
| Stripe Secret | https://dashboard.stripe.com/apikeys | `STRIPE_SECRET_KEY` |
| Stripe Webhook | Stripe Dashboard > Webhooks | `STRIPE_WEBHOOK_SECRET` |
| Resend | https://resend.com/api-keys | `RESEND_API_KEY` |
| LemonSqueezy | https://app.lemonsqueezy.com/settings/api | `LEMONSQUEEZY_API_KEY` |
| HubSpot | https://app.hubspot.com/private-apps | `HUBSPOT_API_KEY` |

```bash
# After updating the key in .env:
cd backend && docker compose restart backend
```

---

## Rotation Checklist

Use this checklist when performing a full credential rotation:

- [ ] Generate new JWT SECRET_KEY and update `.env`
- [ ] Rotate PostgreSQL password (ALTER USER + update `.env`)
- [ ] Rotate Redis password (update `.env` + recreate redis container)
- [ ] Rotate Google OAuth secret (Google Cloud Console + update `.env`)
- [ ] Rotate any active API keys (Stripe, Resend, etc.)
- [ ] Restart all backend services: `docker compose up -d`
- [ ] Run post-rotation verification (see below)
- [ ] Clear any CI/CD caches that may contain old secrets
- [ ] Remove Qoder session caches: `rm -rf /home/www/.qoder/projects/`

---

## Post-Rotation Verification

After rotating credentials, verify all services are functional:

```bash
cd backend

# 1. Check all containers are healthy
docker compose ps

# 2. Test API health endpoint
curl -s http://localhost:8000/health | python3 -m json.tool

# 3. Test database connectivity (article listing)
curl -s http://localhost:8000/api/articles | head -c 200

# 4. Test Redis connectivity (check logs for "Redis connection established")
docker compose logs backend --tail=20 | grep -i redis

# 5. Test OAuth flow (open in browser)
# https://malindra.com/login

# 6. Check for errors in recent logs
docker compose logs backend --tail=50 | grep -i error
```

If any service fails:
1. Check `docker compose logs <service>` for the specific error
2. Verify the `.env` values are consistent (especially URLs containing passwords)
3. Ensure no trailing whitespace or newlines in secret values
4. For PostgreSQL: the password in `DATABASE_URL` must match `DB_PASSWORD`
5. For Redis: the password in `REDIS_URL` must match `REDIS_PASSWORD`
