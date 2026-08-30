-- =========================================================================
-- MIGRACIÓN SUPABASE: Tabla de Recompensas (Rewards) e Historial de Canjes (RLS)
-- =========================================================================

-- 1. Tabla de Catálogo de Recompensas
CREATE TABLE IF NOT EXISTS public.family_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT NOT NULL DEFAULT '🎁',
    point_cost INTEGER NOT NULL DEFAULT 100 CHECK (point_cost >= 0),
    stock INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS family_rewards_group_id_idx ON public.family_rewards (group_id);

-- 2. Tabla de Historial de Canjes
CREATE TABLE IF NOT EXISTS public.reward_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    reward_id UUID REFERENCES public.family_rewards(id) ON DELETE SET NULL,
    member_id UUID NOT NULL,
    reward_title TEXT NOT NULL,
    point_cost INTEGER NOT NULL CHECK (point_cost >= 0),
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS reward_claims_group_id_idx ON public.reward_claims (group_id);
CREATE INDEX IF NOT EXISTS reward_claims_member_id_idx ON public.reward_claims (member_id);

-- 3. Habilitar Seguridad a Nivel de Fila (RLS)
ALTER TABLE public.family_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_claims ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS para family_rewards
DROP POLICY IF EXISTS "Members can view family rewards" ON public.family_rewards;
CREATE POLICY "Members can view family rewards" ON public.family_rewards
    FOR SELECT TO authenticated
    USING (
        group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND created_by = auth.uid())
    );

DROP POLICY IF EXISTS "Members can insert family rewards" ON public.family_rewards;
CREATE POLICY "Members can insert family rewards" ON public.family_rewards
    FOR INSERT TO authenticated
    WITH CHECK (
        group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND created_by = auth.uid())
    );

DROP POLICY IF EXISTS "Members can update family rewards" ON public.family_rewards;
CREATE POLICY "Members can update family rewards" ON public.family_rewards
    FOR UPDATE TO authenticated
    USING (
        group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND created_by = auth.uid())
    );

DROP POLICY IF EXISTS "Members can delete family rewards" ON public.family_rewards;
CREATE POLICY "Members can delete family rewards" ON public.family_rewards
    FOR DELETE TO authenticated
    USING (
        group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND created_by = auth.uid())
    );

-- 5. Políticas RLS para reward_claims
DROP POLICY IF EXISTS "Members can view reward claims" ON public.reward_claims;
CREATE POLICY "Members can view reward claims" ON public.reward_claims
    FOR SELECT TO authenticated
    USING (
        group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND created_by = auth.uid())
    );

DROP POLICY IF EXISTS "Members can insert reward claims" ON public.reward_claims;
CREATE POLICY "Members can insert reward claims" ON public.reward_claims
    FOR INSERT TO authenticated
    WITH CHECK (
        group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND created_by = auth.uid())
    );
