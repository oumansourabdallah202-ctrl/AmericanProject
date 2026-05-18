-- Newsletter subscribers for TestRestaurant. Used by the website (subscribe form), unsubscribe link, and Make.com (send only to subscribed).
-- Run in Supabase → SQL Editor.

-- Create table if you don't have it yet (e.g. email + subscribed_at only)
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  email TEXT PRIMARY KEY,
  subscribed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  subscribed BOOLEAN DEFAULT TRUE NOT NULL,
  unsubscribe_token UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE
);

-- If the table already exists with only (email, subscribed_at), add the new columns:
ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS subscribed BOOLEAN DEFAULT TRUE NOT NULL;

ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS unsubscribe_token UUID;

-- Backfill: give every row a unique token (run once)
UPDATE public.newsletter_subscribers
SET unsubscribe_token = gen_random_uuid()
WHERE unsubscribe_token IS NULL;

ALTER TABLE public.newsletter_subscribers
  ALTER COLUMN unsubscribe_token SET DEFAULT gen_random_uuid(),
  ALTER COLUMN unsubscribe_token SET NOT NULL;

-- Ensure unique tokens (skip if you get "constraint already exists")
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'newsletter_subscribers_unsubscribe_token_key'
  ) THEN
    ALTER TABLE public.newsletter_subscribers
      ADD CONSTRAINT newsletter_subscribers_unsubscribe_token_key UNIQUE (unsubscribe_token);
  END IF;
END $$;

-- Row Level Security (fixes Supabase Security Advisor: "RLS Disabled in Public")
-- Subscribe / unsubscribe / admin list all use the service role on the server → they still work.
-- Direct browser access with the anon key cannot read or write this table.
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Drop if re-running (idempotent)
DROP POLICY IF EXISTS "Service role only" ON public.newsletter_subscribers;

CREATE POLICY "Service role only"
  ON public.newsletter_subscribers
  FOR ALL
  USING (false)
  WITH CHECK (false);

