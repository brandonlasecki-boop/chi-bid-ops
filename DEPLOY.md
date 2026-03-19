# Deploy CHI Bid OPS to Vercel

## Prerequisites

- [Vercel account](https://vercel.com/signup)
- Project pushed to GitHub, GitLab, or Bitbucket (or use Vercel CLI)

## Option A: Deploy via Vercel Dashboard (recommended)

### 1. Import the project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository (connect GitHub/GitLab/Bitbucket if needed)
3. Vercel will auto-detect Next.js — keep the default settings
4. Click **Deploy** (it will fail until env vars are set — that's OK)

### 2. Add environment variables

In your Vercel project: **Settings → Environment Variables**. Add:

| Variable | Value | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | From Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | From Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | From Supabase (keep secret) |
| `NEXT_PUBLIC_APP_URL` | `https://your-project.vercel.app` | Your Vercel URL (for Slack links) |

**Optional (Slack):**

| Variable | Value |
|----------|-------|
| `SLACK_BOT_TOKEN` | `xoxb-...` |
| `SLACK_SIGNING_SECRET` | From api.slack.com |
| `SLACK_CONTRACT_CHANNEL_ID` | `C0XXXXXXX` |

**Optional (Storage, SAM.gov):**

| Variable | Value |
|----------|-------|
| `STORAGE_BUCKET` | `form-documents` |
| `SAM_GOV_API_KEY` | Your SAM.gov API key |

### 3. Redeploy

After adding env vars: **Deployments → ⋮ on latest → Redeploy**

### 4. Update Slack (if using)

1. In [api.slack.com/apps](https://api.slack.com/apps) → your app:
   - **Slash Commands** → Edit Request URL → `https://your-project.vercel.app/api/slack`
   - **Event Subscriptions** → Request URL → `https://your-project.vercel.app/api/slack`
2. Set `NEXT_PUBLIC_APP_URL` in Vercel to your actual URL (e.g. `https://chi-bid-ops.vercel.app`)

---

## Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# From project root
cd c:\CHI_BID_OPS
vercel

# Follow prompts (link to existing project or create new)
# Add env vars when prompted, or in Vercel Dashboard after
```

---

## Post-deploy checklist

- [ ] Run all Supabase migrations (001–010) in Supabase SQL Editor
- [ ] Verify app loads at your Vercel URL
- [ ] Test creating a contract
- [ ] If using Slack: update Request URLs and `NEXT_PUBLIC_APP_URL`
