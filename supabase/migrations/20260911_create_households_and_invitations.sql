-- =========================================================================
-- MIGRACIÓN SUPABASE: Tabla de Hogares (Households) y Miembros (Household Members)
-- Soporte para sistema dinámico de invitaciones por QR y enlace
-- =========================================================================

-- 1. Tabla de Hogares / Familias
CREATE TABLE IF NOT EXISTS public.households (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS households_created_by_idx ON public.households (created_by);

-- 2. Tabla de Miembros del Hogar
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

CREATE INDEX IF NOT EXISTS household_members_household_id_idx ON public.household_members (household_id);
CREATE INDEX IF NOT EXISTS household_members_user_id_idx ON public.household_members (user_id);

-- 3. Habilitar Seguridad a Nivel de Fila (RLS)
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS para households
DROP POLICY IF EXISTS "Authenticated users can view households" ON public.households;
CREATE POLICY "Authenticated users can view households" ON public.households
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can insert households" ON public.households;
CREATE POLICY "Users can insert households" ON public.households
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Owners and members can update households" ON public.households;
CREATE POLICY "Owners and members can update households" ON public.households
    FOR UPDATE TO authenticated
    USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.household_members
            WHERE household_id = public.households.id AND user_id = auth.uid()
        )
    );

-- 5. Políticas RLS para household_members
DROP POLICY IF EXISTS "Members can view household_members" ON public.household_members;
CREATE POLICY "Members can view household_members" ON public.household_members
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.household_members m2
            WHERE m2.household_id = public.household_members.household_id AND m2.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert themselves into household_members" ON public.household_members;
CREATE POLICY "Users can insert themselves into household_members" ON public.household_members
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own membership" ON public.household_members;
CREATE POLICY "Users can update own membership" ON public.household_members
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

-- 6. Trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.handle_households_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_households_updated_at ON public.households;
CREATE TRIGGER set_households_updated_at
    BEFORE UPDATE ON public.households
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_households_updated_at();
