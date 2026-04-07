# NeoCore Security Checklist (Pre-Deploy)

## 1) Secrets and environment
- [ ] No secret values are hardcoded in source files.
- [ ] .env is present only in runtime and never committed.
- [ ] .env.example is up to date and complete.
- [ ] Vercel variables are configured in Project Settings > Environment Variables.
- [ ] DEBUG=False in production.
- [ ] ALLOWED_HOSTS only contains neocoree.xyz and www.neocoree.xyz.

## 2) HTTPS and headers
- [ ] HTTPS redirect is active.
- [ ] HSTS enabled with preload and subdomains.
- [ ] Security headers configured in vercel.json.
- [ ] CSP rules are active and validated in browser response headers.

## 3) Authentication and sessions
- [ ] Account lockout is active (5 failed logins / 15 minutes) with django-axes.
- [ ] Session cookies use Secure, HttpOnly, and SameSite=Lax.
- [ ] CSRF cookie uses Secure and HttpOnly.
- [ ] Session expiration is set to 1 hour and closes on browser close.
- [ ] JWT access token lifetime is 15 minutes; refresh 7 days with rotation.
- [ ] Login success/failure logs include IP, timestamp, and user-agent.

## 4) Rate limiting
- [ ] Login endpoint limited to 5 attempts per IP / 15 minutes.
- [ ] Register endpoint limited to 3 requests per IP / hour.
- [ ] Contact endpoint limited to 5 requests per IP / hour.
- [ ] API global IP limit active at 100 requests / hour.
- [ ] Booking creation limit active at 10 bookings per user / hour.
- [ ] HTTP 429 messages are clear and in Spanish.

## 5) Injection and input validation
- [ ] SQL injection middleware blocks suspicious query/body patterns.
- [ ] No unsafe raw SQL usage (or parameterized only if unavoidable).
- [ ] Search/filter params are range and format validated.
- [ ] Free-text fields are sanitized with bleach.
- [ ] Name, phone, email, and date validations are enforced in serializers.
- [ ] File uploads are validated by extension, MIME (magic bytes), and size.

## 6) Admin security
- [ ] Public /admin/ route points to honeypot only.
- [ ] Real admin URL uses ADMIN_PATH from environment.
- [ ] Admin access is restricted to ADMIN_ALLOWED_IPS.
- [ ] No superuser has username admin.

## 7) Logs and monitoring
- [ ] security.log is generated and receives WARNING+ JSON logs.
- [ ] Security middleware logs suspicious headers/body and sensitive-path probes.
- [ ] Blacklist behavior for abusive IPs is working.
- [ ] Alerting pipeline (SIEM or dashboard) is connected to security.log.

## 8) Health data and GDPR
- [ ] Sensitive model fields are encrypted at rest.
- [ ] Password hashers include Argon2 and PBKDF2.
- [ ] Registration requires GDPR consent.
- [ ] Periodic anonymization for users inactive > 2 years is scheduled.

## 9) Operational commands
- [ ] Run migrations before deployment.
- [ ] Run anonymization dry-run policy checks in staging.
- [ ] Validate settings with DEBUG=False in staging.

## Vercel: add environment variables
1. Open Vercel dashboard.
2. Go to Project Settings > Environment Variables.
3. Add all keys listed in .env.example for Production.
4. Trigger a redeploy.
