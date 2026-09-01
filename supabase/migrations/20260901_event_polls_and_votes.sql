-- Migration: Event Polls and Votes System
-- Allows creating polls to decide events or general topics, voting, and automatic conversion into events.

CREATE TABLE IF NOT EXISTS public.event_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  poll_type TEXT NOT NULL DEFAULT 'event' CHECK (poll_type IN ('event', 'general')),
  category TEXT NOT NULL DEFAULT 'General',
  location TEXT,
  allow_multiple_votes BOOLEAN NOT NULL DEFAULT false,
  close_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
  resolved_event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  winning_option_id UUID,
  resolved_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.event_poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.event_polls(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_date DATE,
  event_time TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.event_poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.event_polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.event_poll_options(id) ON DELETE CASCADE,
  member_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_poll_option_vote UNIQUE (poll_id, option_id, member_id)
);

CREATE TABLE IF NOT EXISTS public.event_poll_participants (
  poll_id UUID NOT NULL REFERENCES public.event_polls(id) ON DELETE CASCADE,
  member_id UUID NOT NULL,
  PRIMARY KEY (poll_id, member_id)
);

-- Indices for fast lookups
CREATE INDEX IF NOT EXISTS idx_event_polls_group_id ON public.event_polls(group_id);
CREATE INDEX IF NOT EXISTS idx_event_poll_options_poll_id ON public.event_poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_event_poll_votes_poll_id ON public.event_poll_votes(poll_id);

-- Enable RLS
ALTER TABLE public.event_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_poll_participants ENABLE ROW LEVEL SECURITY;

-- Permissive policies for authenticated users
CREATE POLICY "Allow select on event_polls" ON public.event_polls FOR SELECT USING (true);
CREATE POLICY "Allow insert on event_polls" ON public.event_polls FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on event_polls" ON public.event_polls FOR UPDATE USING (true);
CREATE POLICY "Allow delete on event_polls" ON public.event_polls FOR DELETE USING (true);

CREATE POLICY "Allow all on event_poll_options" ON public.event_poll_options FOR ALL USING (true);
CREATE POLICY "Allow all on event_poll_votes" ON public.event_poll_votes FOR ALL USING (true);
CREATE POLICY "Allow all on event_poll_participants" ON public.event_poll_participants FOR ALL USING (true);
