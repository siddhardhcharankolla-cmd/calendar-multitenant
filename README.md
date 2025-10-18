# Calendar Multitenant - Final Submission

## Overview
Multi-tenant calendar app using Next.js + Supabase. Admin UI can import global events into an org.

## Setup

1. Clone & install:
   git clone <your-repo-url>
   cd calendar-multitenant
   npm install

2. Configure environment:
   copy .env.example .env.local
   Edit .env.local and fill your Supabase values:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY

## Run locally
npm run dev
Open: http://localhost:3000

## API examples
- Get global/world events:
  GET /api/events?select=*&source=in.(global,world)

- Get org events:
  GET /api/events?select=*&organization_id=eq.<org_uuid>

- Import into org (example slug "acme"):
  POST /api/org/acme/import
  JSON body: { "name":"...", "title":"...", "event_date":"YYYY-MM-DD", "description":"..." }

## Notes
- Do not commit real keys into the repo.
- For deployment (Vercel), add the same env vars in the project settings.

