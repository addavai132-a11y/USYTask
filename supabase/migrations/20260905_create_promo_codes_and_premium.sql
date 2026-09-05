-- =========================================================================
-- MIGRACIÓN SUPABASE: Sistema de Códigos Promocionales y Estatus Premium
-- =========================================================================

-- 1. Añadir columnas de estatus premium a public.profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS premium_until TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS premium_plan TEXT NULL DEFAULT 'none';

-- 2. Crear tabla public.promo_codes
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  plan_type TEXT NOT NULL DEFAULT 'lifetime', -- 'lifetime', 'early_access', 'monthly', 'annual'
  duration_days INTEGER NULL,                -- NULL = vitalicio / lifetime
  description TEXT NULL,                     -- Ej: 'Acceso Anticipado Beta Tester'
  expires_at TIMESTAMPTZ NULL,               -- Caducidad del código en sí
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Índices para búsqueda rápida y concurrencia
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON public.promo_codes (UPPER(TRIM(code)));
CREATE INDEX IF NOT EXISTS idx_promo_codes_is_used ON public.promo_codes (is_used);
CREATE INDEX IF NOT EXISTS idx_promo_codes_used_by ON public.promo_codes (used_by);

-- 4. Habilitar RLS en public.promo_codes
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "Users can view own redeemed codes" ON public.promo_codes;
CREATE POLICY "Users can view own redeemed codes"
  ON public.promo_codes FOR SELECT
  USING (auth.uid() = used_by);

DROP POLICY IF EXISTS "Authenticated users can create promo codes" ON public.promo_codes;
CREATE POLICY "Authenticated users can create promo codes"
  ON public.promo_codes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Creators can view their promo codes" ON public.promo_codes;
CREATE POLICY "Creators can view their promo codes"
  ON public.promo_codes FOR SELECT
  USING (auth.uid() = created_by OR auth.uid() = used_by);

-- 5. Función Atómica Segura para Canjear Códigos (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.redeem_promo_code(input_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_code_record RECORD;
  v_expiry TIMESTAMPTZ := NULL;
  v_clean_code TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No se ha detectado una sesión activa de usuario.');
  END IF;

  v_clean_code := UPPER(TRIM(input_code));
  IF v_clean_code IS NULL OR v_clean_code = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Por favor, introduce un código promocional.');
  END IF;

  -- Bloquear fila del código para prevenir condición de carrera (concurrency safe)
  SELECT * INTO v_code_record
  FROM public.promo_codes
  WHERE UPPER(TRIM(code)) = v_clean_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'El código introducido no existe o no es válido.');
  END IF;

  IF v_code_record.is_used THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este código promocional ya ha sido canjeado anteriormente.');
  END IF;

  IF v_code_record.expires_at IS NOT NULL AND v_code_record.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este código promocional ha caducado.');
  END IF;

  -- Calcular fecha de expiración del beneficio
  IF v_code_record.duration_days IS NOT NULL AND v_code_record.duration_days > 0 THEN
    v_expiry := now() + (v_code_record.duration_days || ' days')::INTERVAL;
  ELSE
    v_expiry := NULL; -- Vitalicio / Lifetime
  END IF;

  -- Actualizar código a utilizado
  UPDATE public.promo_codes
  SET is_used = true,
      used_by = v_user_id,
      used_at = now(),
      updated_at = now()
  WHERE id = v_code_record.id;

  -- Actualizar perfil de usuario a Premium
  UPDATE public.profiles
  SET is_premium = true,
      premium_until = v_expiry,
      premium_plan = v_code_record.plan_type,
      updated_at = now()
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', '¡Código activado con éxito! Ahora dispones de estatus Premium.',
    'plan_type', v_code_record.plan_type,
    'premium_until', v_expiry
  );
END;
$$;

-- 6. Insertar códigos promocionales iniciales de prueba y desarrollo
INSERT INTO public.promo_codes (code, plan_type, description, duration_days)
VALUES 
  ('USY-BETA-2026', 'early_access', 'Acceso Anticipado Beta Tester Vitalicio', NULL),
  ('USY-PRO-DEV', 'lifetime', 'Licencia Premium Desarrollador Vitalicia', NULL),
  ('USY-VIP-30D', 'monthly', 'Pase Premium 30 Días de Prueba', 30)
ON CONFLICT (code) DO NOTHING;
