# ⚡ RefundRadar — Micro-SaaS for RevenueCat Refund Abuse Mitigation

**RefundRadar** is a turnkey, production-ready Micro-SaaS designed for iOS & Android developers using RevenueCat. It monitors incoming purchase/refund webhooks, computes real-time fraud risk using a 4-factor weighted scoring algorithm, and enables 1-click entitlement revocation directly from the dashboard.

---

## 🎯 Architecture & Stack ($0/mo Operating Cost)

RefundRadar is engineered to run entirely on free-tier infrastructure, giving you **100% gross profit margins**:

- **Frontend Dashboard:** Next.js 14 (App Router), React Server Components, Tailwind CSS v4, Shadcn UI, TypeScript.
- **Backend Edge Worker:** Cloudflare Workers (TypeScript) running on edge nodes (<200ms ingestion latency).
- **Database & Auth:** Supabase PostgreSQL with multi-tenant Row Level Security (RLS) and AES-GCM database key encryption.
- **Email Alerts:** Resend API for instant high-risk refund notifications.
- **Integrations:** RevenueCat Webhooks & REST API v2.

---

## 🚀 Quick Setup Guide for Buyer (10-Minute Deployment)

Follow these steps to deploy your instance of RefundRadar:

### Step 1: Clone & Install Dependencies
```bash
git clone https://github.com/your-username/refundradar.git
cd refundradar
pnpm install
```

### Step 2: Configure Environment Variables
```bash
cp .env.example .env
```
Edit `.env` with your credentials:
| Variable | Source |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_WORKER_URL` | Your deployed Cloudflare Worker URL |
| `ENCRYPTION_KEY` | Generate: `openssl rand -hex 32` |
| `RESEND_API_KEY` | Resend Dashboard → API Keys |
| `REVENUECAT_WEBHOOK_SECRET` | Generate a secret, add to RevenueCat webhook config |

### Step 3: Initialize Supabase Database
1. Create a new Supabase project
2. Run migrations from `packages/database/supabase/migrations/` in Supabase SQL Editor
3. Enable Email Auth in Supabase Auth settings

### Step 4: Deploy Cloudflare Worker
```bash
cd apps/worker
pnpm run deploy
# Add the deployed URL to your .env as NEXT_PUBLIC_WORKER_URL
```

### Step 5: Configure RevenueCat Webhook
1. In RevenueCat Dashboard → Integrations → Webhooks
2. Add endpoint: `https://your-worker.your-subdomain.workers.dev/webhook/revenuecat`
3. Subscribe to events: `REFUND` (required), `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`
4. Set Shared Secret = your `REVENUECAT_WEBHOOK_SECRET`

### Step 6: Launch Dashboard
```bash
cd apps/dashboard
pnpm run dev
# Visit http://localhost:3000
```

---

## 🔑 Core Features

### 1. Real-Time Webhook Ingestion (<200ms)
- Cloudflare Worker receives RevenueCat webhooks at edge
- HMAC-SHA256 signature verification (per-app secrets)
- Idempotent processing via `revenuecat_event_id` uniqueness

### 2. 4-Factor Weighted Risk Scoring (0-100)
| Factor | Weight | Description |
|--------|--------|-------------|
| **Duration Before Refund** | 35% | Hours between purchase and refund request |
| **Refund Frequency** | 30% | Previous refunds by same `app_user_id` |
| **Billing Cycle Proximity** | 20% | Refund requested on last day before renewal |
| **Product Type** | 15% | Consumable vs subscription products |

**Risk Tiers:**
- 🟢 **Green (0-39):** Normal activity
- 🟡 **Yellow (40-69):** Medium risk — review recommended
- 🔴 **Red (70-100):** High risk — immediate action advised

### 3. Dashboard & Analytics
- **KPI Cards:** Total refunds inspected, high-risk caught, revenue saved, active apps
- **Refund Trends Chart:** 30-day time series (total vs high-risk)
- **Alerts Table:** Filterable by risk level, status, app, date range, search
- **Event Detail Modal:** Timeline, score breakdown, user history, raw payload

### 4. 1-Click Entitlement Revocation
- Semi-automated (Human-in-the-loop by default)
- Type "REVOKE" confirmation prevents accidental revocations
- Calls RevenueCat API `POST /v1/subscribers/{id}/entitlements/{id}/revoke`
- Audit trail in `entitlement_revocations` table

### 5. Email Alerts (Resend)
- Real-time emails for Red alerts (configurable threshold)
- Rich HTML templates with CTA to dashboard
- Quick-action "Revoke Entitlement" link in email

### 6. Security & Compliance
- **AES-GCM Encryption:** RevenueCat API keys & webhook secrets encrypted at rest
- **RLS Policies:** Multi-tenant isolation at database level
- **HMAC Verification:** Webhook spoofing prevention
- **GDPR-Ready:** 90-day auto-prune, right-to-erasure function
- **No PII Stored:** Only `app_user_id` (pseudonymous)

---

## 📁 Project Structure (Turborepo Monorepo)

```
refundradar/
├── apps/
│   ├── dashboard/          # Next.js 14 Dashboard
│   │   ├── src/app/        # App Router pages & API routes
│   │   ├── src/components/ # Shadcn UI + custom components
│   │   ├── src/lib/        # Supabase client, services, validations
│   │   └── src/hooks/      # React Query hooks
│   └── worker/             # Cloudflare Worker
│       ├── src/routes/     # /webhook/revenuecat, /api/revoke
│       ├── src/services/   # Database, Scoring, RevenueCat, Email
│       └── src/crypto/     # HMAC verification, AES-GCM
├── packages/
│   ├── shared/             # Types, constants, scoring, validators
│   └── database/           # Supabase migrations, RLS policies
├── turbo.json              # Turborepo pipeline config
├── pnpm-workspace.yaml     # Workspace configuration
└── .env.example            # Environment template
```

---

## 🔧 Development Commands

```bash
# Install dependencies
pnpm install

# Run all dev servers
pnpm dev

# Build all packages
pnpm build

# Lint all packages
pnpm lint

# Database migrations
pnpm db:migrate

# Open Supabase Studio
pnpm db:studio
```

---

## 📦 Deployment Checklist

- [ ] Supabase project created with migrations applied
- [ ] Cloudflare Worker deployed with env vars set
- [ ] RevenueCat webhook configured with correct secret
- [ ] Resend domain verified and API key added
- [ ] Dashboard deployed (Vercel/Cloudflare Pages)
- [ ] DNS configured for custom domain (optional)
- [ ] Test webhook end-to-end with RevenueCat test events
- [ ] Verify 1-click revocation works in staging

---

## 📄 License

MIT License — Free for commercial use. Built for TrustMRR marketplace.

---

## 🤝 Support

For questions or issues, open a GitHub issue or contact the seller via TrustMRR messaging.

**Built with ❤️ for indie developers who want to protect their revenue without building fraud infrastructure from scratch.**