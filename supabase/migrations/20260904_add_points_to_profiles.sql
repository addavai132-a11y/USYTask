-- =========================================================================
-- MIGRACIÓN SUPABASE: Puntos en Profiles y Sincronización en Tiempo Real
-- =========================================================================

-- 1. Añadir columna points a public.profiles si no existe
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 0;

-- 2. Asegurar que public.group_members tiene columna points
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'group_members' 
          AND column_name = 'points'
    ) THEN
        ALTER TABLE public.group_members ADD COLUMN points INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- 3. Habilitar Supabase Realtime en profiles y group_members para cambios en puntos
DO $$
BEGIN
    -- profiles
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'profiles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    END IF;

    -- group_members
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'group_members'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL; -- Si la publicación no existe o no hay permisos de superuser, continuar
END $$;

-- 4. Función de sincronización de puntos acumulados para un usuario
CREATE OR REPLACE FUNCTION public.get_or_sync_user_points(target_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_pts INTEGER := 0;
    member_pts INTEGER := 0;
    task_pts INTEGER := 0;
    final_pts INTEGER := 0;
BEGIN
    -- Puntos actuales en profile
    SELECT COALESCE(points, 0) INTO current_pts
    FROM public.profiles
    WHERE id = target_user_id;

    -- Puntos acumulados en group_members
    SELECT COALESCE(SUM(points), 0) INTO member_pts
    FROM public.group_members
    WHERE user_id = target_user_id;

    -- Puntos acumulados de tareas completadas
    SELECT COALESCE(SUM(t.points), 0) INTO task_pts
    FROM public.tasks t
    JOIN public.group_members gm ON gm.group_id = t.group_id
    WHERE gm.user_id = target_user_id
      AND t.completed = true
      AND (t.assigned_to_member_id = gm.id::text OR gm.id::text = ANY(t.assigned_member_ids));

    final_pts := GREATEST(current_pts, member_pts, task_pts);

    -- Actualizar profile si es mayor
    IF final_pts > current_pts THEN
        UPDATE public.profiles
        SET points = final_pts,
            updated_at = timezone('utc'::text, now())
        WHERE id = target_user_id;
    END IF;

    RETURN final_pts;
END;
$$;
