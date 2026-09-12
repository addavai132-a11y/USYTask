-- =========================================================================
-- MIGRACIÓN / AJUSTE DE POLÍTICAS RLS EN SUPABASE
-- Tablas: households y household_members (con soporte adicional para groups)
-- Permite:
--   1. SELECT en households a usuarios autenticados y anónimos (para previsualizar nombre de la familia).
--   2. INSERT en household_members a usuarios autenticados vinculando auth.uid() = user_id.
-- =========================================================================

-- 1. ASEGURAR QUE LAS TABLAS EXISTEN
CREATE TABLE IF NOT EXISTS public.households (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.household_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (household_id, user_id)
);

-- Índices para optimizar rendimiento de consultas
CREATE INDEX IF NOT EXISTS households_created_by_idx ON public.households (created_by);
CREATE INDEX IF NOT EXISTS household_members_household_id_idx ON public.household_members (household_id);
CREATE INDEX IF NOT EXISTS household_members_user_id_idx ON public.household_members (user_id);

-- 2. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS PARA LA TABLA 'households'

-- Eliminar políticas previas que puedan entrar en conflicto
DROP POLICY IF EXISTS "Allow authenticated select on households" ON public.households;
DROP POLICY IF EXISTS "Allow anon select on households" ON public.households;
DROP POLICY IF EXISTS "Authenticated users can view households" ON public.households;
DROP POLICY IF EXISTS "Members can view households" ON public.households;
DROP POLICY IF EXISTS "Users can view households" ON public.households;
DROP POLICY IF EXISTS "Users can insert households" ON public.households;
DROP POLICY IF EXISTS "Owners and members can update households" ON public.households;

-- A) Permitir SELECT a cualquier usuario autenticado (para ver la familia a la que se va a unir)
CREATE POLICY "Allow authenticated select on households"
ON public.households
FOR SELECT
TO authenticated
USING (true);

-- B) Permitir SELECT a usuarios anónimos (para previsualizar la invitación al escanear el QR antes del login)
CREATE POLICY "Allow anon select on households"
ON public.households
FOR SELECT
TO anon
USING (true);

-- C) Permitir INSERT a usuarios autenticados para crear su propia familia
CREATE POLICY "Allow authenticated insert on households"
ON public.households
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- D) Permitir UPDATE a creadores y miembros
CREATE POLICY "Allow update on households"
ON public.households
FOR UPDATE
TO authenticated
USING (
    created_by = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.household_members hm
        WHERE hm.household_id = public.households.id
        AND hm.user_id = auth.uid()
    )
);

-- 4. POLÍTICAS PARA LA TABLA 'household_members'

-- Eliminar políticas previas en conflicto
DROP POLICY IF EXISTS "Allow authenticated insert own membership" ON public.household_members;
DROP POLICY IF EXISTS "Allow authenticated select on household_members" ON public.household_members;
DROP POLICY IF EXISTS "Users can insert own membership" ON public.household_members;
DROP POLICY IF EXISTS "Users can insert household members" ON public.household_members;
DROP POLICY IF EXISTS "Users can insert themselves into household_members" ON public.household_members;
DROP POLICY IF EXISTS "Members can view household_members" ON public.household_members;
DROP POLICY IF EXISTS "Users can update own membership" ON public.household_members;
DROP POLICY IF EXISTS "Users can leave household" ON public.household_members;

-- A) CRÍTICA: Permitir que un usuario autenticado inserte una fila vinculando su propio auth.uid() con el household_id
CREATE POLICY "Allow authenticated insert own membership"
ON public.household_members
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- B) Permitir SELECT a miembros para ver los integrantes de su familia
CREATE POLICY "Allow authenticated select on household_members"
ON public.household_members
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.household_members hm
        WHERE hm.household_id = public.household_members.household_id
        AND hm.user_id = auth.uid()
    )
);

-- C) Permitir UPDATE a su propia membresía
CREATE POLICY "Allow authenticated update own membership"
ON public.household_members
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- D) Permitir DELETE (salir de la familia)
CREATE POLICY "Allow authenticated delete own membership"
ON public.household_members
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 5. ASIGNAR PERMISOS (GRANTS) A LOS ROLES DE SUPABASE
GRANT SELECT, INSERT, UPDATE, DELETE ON public.households TO authenticated;
GRANT SELECT ON public.households TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.household_members TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =========================================================================
-- COMPATIBILIDAD OPCIONAL: Si tu proyecto tiene tablas 'groups' y 'group_members'
-- =========================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'groups') THEN
        ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow authenticated select on groups" ON public.groups;
        CREATE POLICY "Allow authenticated select on groups" ON public.groups FOR SELECT TO authenticated USING (true);
        DROP POLICY IF EXISTS "Allow anon select on groups" ON public.groups;
        CREATE POLICY "Allow anon select on groups" ON public.groups FOR SELECT TO anon USING (true);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'group_members') THEN
        ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow authenticated insert own group membership" ON public.group_members;
        CREATE POLICY "Allow authenticated insert own group membership" ON public.group_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
        DROP POLICY IF EXISTS "Allow authenticated select on group_members" ON public.group_members;
        CREATE POLICY "Allow authenticated select on group_members" ON public.group_members FOR SELECT TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = public.group_members.group_id AND gm.user_id = auth.uid()));
    END IF;
END $$;
