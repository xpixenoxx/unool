# Complete Setup Guide for 100% Working Product

## Prerequisites Checklist
- [ ] Supabase project
- [ ] Upstash QStash + Redis
- [ ] Anthropic API key
- [ ] OAuth apps (LinkedIn, X, Meta)

---

## 1. Supabase Setup (5 min)
**Go to:** https://supabase.com/dashboard

1. **Create project** → Get credentials from Settings → API
2. **Run migrations** in SQL Editor:
   ```bash
   # Copy contents of supabase-schema.sql and run in Supabase SQL Editor
   # Then run supabase-rls-fix.sql
   ```
3. **Fill in .env.local:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   SUPABASE_PROJECT_ID=your-project-ref
   ```

---

## 2. Upstash Setup (3 min)
**Go to:** https://console.upstash.com

### QStash (for webhooks/cron)
1. Create QStash → Get `QSTASH_URL`, `QSTASH_TOKEN`
2. Get signing keys from QStash dashboard

### Redis (for rate limiting, SSE)
1. Create Redis database → Get REST URL and Token

### Fill in .env.local:
```
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=xxx
QSTASH_CURRENT_SIGNING_KEY=sig_xxx
QSTASH_NEXT_SIGNING_KEY=sig_xxx

UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

---

## 3. Anthropic API (2 min)
**Go to:** https://console.anthropic.com/settings/keys

1. Create API key
2. **Verify model access** - check your workspace has model access enabled
3. Fill in:
```
ANTHROPIC_API_KEY=sk-ant-api03-xxx
ANTHROPIC_MODEL=claude-sonnet-5
AI_DEFAULT_MODEL=claude-sonnet-5
```

**Available models (as of 2025):**
- `claude-sonnet-5` (recommended - Sonnet 4)
- `claude-haiku-4-5-20251001` (fast/cheap)
- `claude-opus-4-1-20250805` (most capable)

---

## 4. OAuth Apps (15 min total)

### LinkedIn
**Go to:** https://www.linkedin.com/developers/apps

1. Create app → Products: "Sign In with LinkedIn", "Share on LinkedIn"
2. Redirect URI: `http://localhost:3000/api/auth/platform/callback`
3. Scopes: `r_liteprofile`, `w_member_social`, `rw_organization_admin`
```
LINKEDIN_CLIENT_ID=xxx
LINKEDIN_CLIENT_SECRET=xxx
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/auth/platform/callback
```

### X/Twitter
**Go to:** https://developer.twitter.com/en/portal/dashboard

1. Create app → OAuth 2.0 with PKCE
2. Type: "Web App"
3. Redirect URI: `http://localhost:3000/api/auth/platform/callback`
4. Scopes: `tweet.read`, `tweet.write`, `users.read`, `offline.access`
```
X_CLIENT_ID=xxx
X_CLIENT_SECRET=xxx
X_REDIRECT_URI=http://localhost:3000/api/auth/platform/callback
```

### Meta/Threads
**Go to:** https://developers.facebook.com/apps/

1. Create app → "Business" type
2. Add "Threads API" product
3. Redirect URI: `http://localhost:3000/api/auth/platform/callback`
4. Scopes: `threads_basic`, `threads_content_publish`, `threads_manage_replies`, `threads_manage_insights`
```
META_CLIENT_ID=xxx
META_CLIENT_SECRET=xxx
META_REDIRECT_URI=http://localhost:3000/api/auth/platform/callback
```

---

## 5. Webhook Secrets (1 min)
```bash
# Generate random secrets
openssl rand -hex 32  # run 3 times
```
```
LINKEDIN_WEBHOOK_SECRET=xxx
X_WEBHOOK_SECRET=xxx
META_WEBHOOK_SECRET=xxx
```

---

## 6. Encryption Key (1 min)
```bash
openssl rand -base64 32
```
```
ENCRYPTION_KEY=xxx
ENCRYPTION_KEY_VERSION=1
```

---

## 7. Ngrok for Webhooks (Required for Platform OAuth callbacks)
```bash
# Install ngrok
npm install -g ngrok

# Run tunnel
ngrok http 3000
```

Update OAuth redirect URIs to use your ngrok URL:
```
LINKEDIN_REDIRECT_URI=https://your-ngrok.ngrok.io/api/auth/platform/callback
X_REDIRECT_URI=https://your-ngrok.ngrok.io/api/auth/platform/callback
META_REDIRECT_URI=https://your-ngrok.ngrok.io/api/auth/platform/callback
```

**Configure webhook URLs in each platform:**
- LinkedIn: `https://your-ngrok.ngrok.io/api/webhooks/platform?platform=linkedin`
- X: `https://your-ngrok.ngrok.io/api/webhooks/platform?platform=x`
- Threads: `https://your-ngrok.ngrok.io/api/webhooks/platform?platform=threads`

---

## 8. Run Database Migrations
```bash
# In Supabase SQL Editor, run these files in order:
# 1. supabase-schema.sql
# 2. supabase-rls-fix.sql
```

---

## 9. Start Development
```bash
npm install
npm run dev
```

Visit: http://localhost:3000

---

## 10. Test Complete Flow

| Step | Action | Expected |
|------|--------|----------|
| 1 | Sign up / Login | Dashboard loads |
| 2 | Go to **Presence** tab | Profile editor |
| 3 | Paste LinkedIn/GitHub URL → **Generate** | AI extracts profile |
| 4 | Claim **subdomain** | Shows available/taken |
| 5 | Add links, proof points, theme | Save profile |
| 6 | Go to **Composer** tab | Source input |
| 7 | Write content → **Generate Drafts** | 3 platform variants |
| 8 | Review/edit each tab | All green "Ready" |
| 9 | Connect platforms in **Dashboard** | OAuth flow |
| 10 | **Publish All** | Success toasts with URLs |
| 11 | Visit `yourname.unool.co` | Live profile |
| 12 | Check **Sync** (SSE) | Real-time updates |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Model not found" | Use `claude-sonnet-5` not date-suffixed names |
| "Invalid redirect URI" | Match exactly in OAuth app + .env |
| Webhook 401 | Check `LINKEDIN_WEBHOOK_SECRET` matches platform config |
| SSE not connecting | Verify `UPSTASH_REDIS_REST_URL` and token |
| Publish fails | Check platform connection status in Dashboard |
| "Token expired" | Reconnect platform (auto-refresh should work) |

---

## Production Deployment (Vercel)
1. Push to GitHub
2. Import in Vercel
3. Add all env vars from `.env.example`
4. Update OAuth redirect URIs to production domain
5. Update webhook URLs to production domain
6. Deploy

---

## Files to Reference
- `.env.example` - All required variables
- `supabase-schema.sql` - Database schema
- `supabase-rls-fix.sql` - Row Level Security policies
- `CLAUDE.md` - Project instructions