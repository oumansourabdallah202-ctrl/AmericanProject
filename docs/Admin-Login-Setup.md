# Admin Login Setup

This project already includes an admin page at `/admin` and a server-side verification endpoint for Supabase-authenticated admin access.

## Required environment variables

Set these variables in your deployment environment (Netlify or Vercel) and in a local `.env` file for development:

- `SUPABASE_URL` — your Supabase project URL
- `SUPABASE_ANON_KEY` — your Supabase anon public key
- `SUPABASE_SERVICE_ROLE_KEY` — your Supabase service role key
- `VITE_SUPABASE_URL` — same as `SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` — same as `SUPABASE_ANON_KEY`
- `ADMIN_EMAIL` — the admin email allowed to access `/admin`

## How it works

- `client/src/lib/supabaseClient.ts` creates the browser Supabase client using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- `client/src/pages/Admin.tsx` shows the login form if the user is not authenticated, then shows the admin dashboard after successful sign-in.
- `api/admin/login.ts` verifies the current Supabase access token and checks `ADMIN_EMAIL`.

## Complete these steps

1. Create the admin user in Supabase Auth.
2. Add the environment variables above to your Netlify or Vercel project.
3. Deploy the site.
4. Open `/admin` in your browser and sign in with the admin email and password.

## Local development

Create a `.env` file in the project root with the same variables, for example:

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
ADMIN_EMAIL=admin@TestRestaurant.ch
```

Then run your normal development command, e.g. `pnpm run dev`.
