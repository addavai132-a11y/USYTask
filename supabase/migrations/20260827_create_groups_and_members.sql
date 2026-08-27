-- =========================================================================
-- MIGRACIÓN SUPABASE: Tabla de Grupos / Hogares y Miembros
-- =========================================================================

-- 1. Tabla de Grupos / Espacios Compartidos
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('family', 'roommates', 'couple', 'personal', 'other')),
    icon TEXT,
    invite_code TEXT NOT NULL UNIQUE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índice para búsqueda rápida por código de invitación
CREATE INDEX IF NOT EXISTS groups_invite_code_idx ON public.groups (invite_code);

-- 2. Tabla de Miembros del Grupo
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'adult',
    is_admin BOOLEAN NOT NULL DEFAULT false,
    is_owner BOOLEAN NOT NULL DEFAULT false,
    avatar_color TEXT,
    points INTEGER NOT NULL DEFAULT 0,
    streak INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS group_members_group_id_idx ON public.group_members (group_id);
CREATE INDEX IF NOT EXISTS group_members_user_id_idx ON public.group_members (user_id);

-- 3. Trigger para updated_at
CREATE OR REPLACE FUNCTION public.handle_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_groups_updated_at ON public.groups;
CREATE TRIGGER set_groups_updated_at
    BEFORE UPDATE ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_groups_updated_at();

-- 4. Habilitar Seguridad a Nivel de Fila (RLS)
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Acceso RLS
DROP POLICY IF EXISTS "Members can view groups" ON public.groups;
CREATE POLICY "Members can view groups" ON public.groups
    FOR SELECT TO authenticated
    USING (
        id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
        OR created_by = auth.uid()
    );

DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
CREATE POLICY "Authenticated users can create groups" ON public.groups
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Owners can update groups" ON public.groups;
CREATE POLICY "Owners can update groups" ON public.groups
    FOR UPDATE TO authenticated
    USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Members can view group members" ON public.group_members;
CREATE POLICY "Members can view group members" ON public.group_members
    FOR SELECT TO authenticated
    USING (
        group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
        OR user_id = auth.uid()
    );

DROP POLICY IF EXISTS "Users can insert group members" ON public.group_members;
CREATE POLICY "Users can insert group members" ON public.group_members
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND created_by = auth.uid()));

DROP POLICY IF EXISTS "Users can update own membership" ON public.group_members;
CREATE POLICY "Users can update own membership" ON public.group_members
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND created_by = auth.uid()));
