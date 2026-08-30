-- Migration: Notifications System, Proximity & Realtime Channels
-- Date: 2026-08-30

CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  recipient_user_id TEXT,
  type TEXT NOT NULL DEFAULT 'system',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  action_url TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing
CREATE INDEX IF NOT EXISTS idx_notifications_group_user ON public.notifications (group_id, recipient_user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications (created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies for notifications
DROP POLICY IF EXISTS "Group members can view notifications" ON public.notifications;
CREATE POLICY "Group members can view notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = notifications.group_id
      AND gm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Group members can insert notifications" ON public.notifications;
CREATE POLICY "Group members can insert notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = notifications.group_id
      AND gm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Group members can update notifications" ON public.notifications;
CREATE POLICY "Group members can update notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = notifications.group_id
      AND gm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Group members can delete notifications" ON public.notifications;
CREATE POLICY "Group members can delete notifications"
  ON public.notifications
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = notifications.group_id
      AND gm.user_id = auth.uid()
    )
  );

GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

-- Enable Realtime publication on notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;
