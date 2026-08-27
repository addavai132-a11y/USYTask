-- =========================================================================
-- MIGRACIÓN SUPABASE: Tabla de Recuerdos (Memories) y Storage Bucket
-- =========================================================================

-- 1. Tabla de Recuerdos
CREATE TABLE IF NOT EXISTS public.memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    image_url TEXT,
    image_placeholder TEXT,
    tags TEXT[] DEFAULT '{}',
    tagged_member_ids TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS memories_group_id_idx ON public.memories (group_id);
CREATE INDEX IF NOT EXISTS memories_date_idx ON public.memories (date DESC);

-- 2. Habilitar RLS en public.memories
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view memories" ON public.memories;
CREATE POLICY "Members can view memories" ON public.memories
    FOR SELECT TO authenticated
    USING (
        group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
        OR created_by = auth.uid()
    );

DROP POLICY IF EXISTS "Members can insert memories" ON public.memories;
CREATE POLICY "Members can insert memories" ON public.memories
    FOR INSERT TO authenticated
    WITH CHECK (
        group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
        OR auth.uid() = created_by
    );

DROP POLICY IF EXISTS "Members can update memories" ON public.memories;
CREATE POLICY "Members can update memories" ON public.memories
    FOR UPDATE TO authenticated
    USING (
        group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
        OR created_by = auth.uid()
    );

DROP POLICY IF EXISTS "Members can delete memories" ON public.memories;
CREATE POLICY "Members can delete memories" ON public.memories
    FOR DELETE TO authenticated
    USING (
        group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
        OR created_by = auth.uid()
    );

-- 3. Crear Bucket de Supabase Storage para Recuerdos
INSERT INTO storage.buckets (id, name, public)
VALUES ('memories', 'memories', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 4. Políticas de Seguridad RLS en storage.objects para el bucket 'memories'
DROP POLICY IF EXISTS "Public can view memory images" ON storage.objects;
CREATE POLICY "Public can view memory images" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'memories');

DROP POLICY IF EXISTS "Authenticated users can upload memory images" ON storage.objects;
CREATE POLICY "Authenticated users can upload memory images" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'memories');

DROP POLICY IF EXISTS "Authenticated users can update memory images" ON storage.objects;
CREATE POLICY "Authenticated users can update memory images" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'memories');

DROP POLICY IF EXISTS "Authenticated users can delete memory images" ON storage.objects;
CREATE POLICY "Authenticated users can delete memory images" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'memories');
