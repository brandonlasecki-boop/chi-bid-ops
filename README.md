# CHI Bid Ops - Contract Bid Management System

A production-quality MVP for managing SAM.gov contract bids. Assign forms to team members, track status, and integrate with Slack.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (Postgres + Auth + Storage)
- **State**: Server Actions
- **Slack**: Web API + custom API route for slash commands

## Prerequisites

- Node.js 18+
- Supabase account
- Slack workspace (for integrations)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run migrations:
   - In Supabase Dashboard → SQL Editor, run the contents of:
     - `supabase/migrations/001_initial_schema.sql`
     - `supabase/migrations/002_progress_function.sql`
     - `supabase/migrations/003_sam_gov_fields.sql` (if you ran 001 before SAM.gov fields)
     - `supabase/migrations/004_storage_bucket.sql` (for document uploads)
   - Or create the storage bucket manually: Storage → New bucket → "form-documents" (public)
3. Get your project URL and keys from Settings → API

### 3. Environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Optional - for Slack
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
SLACK_CONTRACT_CHANNEL_ID=C0XXXXXXX
```

### 4. Seed data (optional)

```bash
npm run db:seed
```

Creates 1 contract with 5 forms in various statuses.

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Slack Integration

### Create a Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → Create New App
2. Add Bot Token Scopes: `chat:write`, `commands`, `users:read`, `users:read.email` (for @ mentions)
3. Enable Event Subscriptions:
   - Event Subscriptions → Enable Events → On
   - Request URL: `https://your-domain.com/api/slack`
   - Subscribe to bot events: `message.channels` (so replies in the contract channel thread are received)
4. Create a slash command:
   - Command: `/contract-status`
   - Request URL: `https://your-domain.com/api/slack`
   - Short description: "Get contract status summary"
4. Install the app to your workspace
5. Copy Bot Token and Signing Secret to `.env.local`
6. Invite the bot to your contract channel and set `SLACK_CONTRACT_CHANNEL_ID`

### Features

- **Contract created**: Posts to the configured channel, saves `thread_ts` for follow-ups
- **Form assigned**: Sends DM to assignee (if Slack user ID), posts in contract thread
- **Form completed**: Posts update in contract thread when status changes in dashboard
- **Form completion from Slack**: Reply in the contract thread with the form name + "complete" (e.g. "Technical Approach complete" or "✅ Technical Approach") and the dashboard will mark that form complete
- **Slash command**: `/contract-status <contract-id>` returns a summary

## Project Structure

```
/app              - Next.js App Router pages
/components       - React components
/lib              - DB, business logic, Slack
  /db             - Supabase queries
  /business       - Progress calculation
  /slack          - Slack notifications
  /supabase       - Client setup
/types            - TypeScript types
/api              - API routes (Slack)
supabase/migrations - SQL schema
scripts           - Seed script
```

## Key Features

- **Dashboard**: List contracts with progress bars and status
- **Contract Detail**: View contract, progress, and forms table
- **Forms Table**: Inline status and assignment updates
- **Progress**: Auto-calculated from form statuses and weights
- **Slack**: Notifications and `/contract-status` command

## Database Schema

- **contracts**: id, title, agency, due_date, status, progress, slack_thread_ts
- **forms**: id, contract_id, name, assigned_to, status, weight, due_date
- **documents**: id, form_id, file_url, file_name

Progress mapping: `not_started=0`, `in_progress=50`, `in_review=80`, `blocked=0`, `complete=100`
