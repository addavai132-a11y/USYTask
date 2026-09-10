-- =========================================================================
-- MIGRACIÓN: notification_log + actualizar handle_new_user para crear
-- notification_preferences automáticamente al registrar un usuario.
-- Date: 2026-09-10
-- =========================================================================

-- 1. Tabla notification_log — Registro de envíos para deduplicación
-- Solo accesible via service_role (server-side cron), sin políticas RLS para usuarios.
CREATE TABLE IF NOT EXISTS public.notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  reference_id TEXT,
  reference_type TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB
);

-- Índice único para deduplicación atómica: INSERT falla silenciosamente
-- si ya existe una fila con el mismo (user_id, category, reference_id).
CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_log_dedup
  ON public.notification_log (user_id, category, reference_id)
  WHERE reference_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notification_log_user_sent
  ON public.notification_log (user_id, sent_at DESC);

ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;
-- Sin políticas: solo el cliente admin (service_role) puede leer/escribir aquí.

GRANT ALL ON public.notification_log TO service_role;

-- 2. Actualizar handle_new_user para crear notification_preferences automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, date_of_birth, profile_completed, notifications_enabled)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    (NEW.raw_user_meta_data->>'date_of_birth')::date,
    COALESCE((NEW.raw_user_meta_data->>'profile_completed')::boolean, false),
    COALESCE((NEW.raw_user_meta_data->>'notifications_enabled')::boolean, false)
  );

  -- Crear automáticamente la fila de preferencias de notificación
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
