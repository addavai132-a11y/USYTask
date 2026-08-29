-- =========================================================================
-- MIGRACIÓN SUPABASE: Persistencia Completa de Espacios, Tareas y Actividades
-- =========================================================================

-- 1. Tabla de Espacios / Grupos (Viviendas / Familias)
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'family' CHECK (type IN ('family', 'roommates', 'couple', 'personal', 'other')),
    icon TEXT,
    invite_code TEXT NOT NULL UNIQUE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS groups_invite_code_idx ON public.groups (invite_code);
CREATE INDEX IF NOT EXISTS groups_created_by_idx ON public.groups (created_by);

-- 2. Tabla de Miembros del Espacio
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

-- 3. Tabla de Tareas vinculadas al grupo y al usuario
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 10,
    assigned_to_member_id TEXT,
    assigned_member_ids TEXT[] DEFAULT '{}',
    completed BOOLEAN NOT NULL DEFAULT false,
    section TEXT NOT NULL DEFAULT 'familia',
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    needs_approval BOOLEAN DEFAULT false,
    recurring TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS tasks_group_id_idx ON public.tasks (group_id);
CREATE INDEX IF NOT EXISTS tasks_completed_idx ON public.tasks (completed);

-- 4. Tabla de Eventos del Calendario
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    time TEXT,
    end_time TEXT,
    location TEXT,
    category TEXT NOT NULL DEFAULT 'General',
    assigned_member_ids TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS events_group_id_idx ON public.events (group_id);
CREATE INDEX IF NOT EXISTS events_date_idx ON public.events (date);

-- 5. Tabla de Recordatorios
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    due_date DATE NOT NULL,
    type TEXT DEFAULT 'otros',
    assigned_member_ids TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS reminders_group_id_idx ON public.reminders (group_id);

-- 6. Habilitar RLS en todas las tablas
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- 7. Políticas de Acceso RLS por Grupo y Usuario
DROP POLICY IF EXISTS "Users can view their groups" ON public.groups;
CREATE POLICY "Users can view their groups" ON public.groups
    FOR SELECT TO authenticated
    USING (
        id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
        OR created_by = auth.uid()
    );

DROP POLICY IF EXISTS "Users can create groups" ON public.groups;
CREATE POLICY "Users can create groups" ON public.groups
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their groups" ON public.groups;
CREATE POLICY "Users can update their groups" ON public.groups
    FOR UPDATE TO authenticated
    USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can view group tasks" ON public.tasks;
CREATE POLICY "Users can view group tasks" ON public.tasks
    FOR SELECT TO authenticated
    USING (
        group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
        OR created_by = auth.uid()
    );

DROP POLICY IF EXISTS "Users can modify group tasks" ON public.tasks;
CREATE POLICY "Users can modify group tasks" ON public.tasks
    FOR ALL TO authenticated
    USING (
        group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
        OR created_by = auth.uid()
    );
