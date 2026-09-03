-- =========================================================================
-- MIGRACIÓN: Reglas de validación de puntos mínimos y permisos de completado de tareas
-- =========================================================================

-- 1. Restricción de base de datos: Nunca menos de 10 puntos por tarea
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tasks_min_points_check'
    ) THEN
        ALTER TABLE public.tasks 
        ADD CONSTRAINT tasks_min_points_check 
        CHECK (points >= 10);
    END IF;
END $$;

-- 2. Restricción de base de datos: Recompensas mínimo 10 puntos de coste
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'family_rewards_point_cost_check'
    ) THEN
        ALTER TABLE public.family_rewards DROP CONSTRAINT family_rewards_point_cost_check;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'family_rewards'
    ) THEN
        ALTER TABLE public.family_rewards
        ADD CONSTRAINT family_rewards_point_cost_check
        CHECK (point_cost >= 10);
    END IF;
END $$;

-- 3. Función auxiliar para verificar si un usuario autenticado es la persona asignada a una tarea
CREATE OR REPLACE FUNCTION public.is_task_assigned_to_user(task_row public.tasks, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.group_members gm
        WHERE gm.user_id = user_uuid
          AND gm.group_id = task_row.group_id
          AND (
              gm.id::text = task_row.assigned_to_member_id
              OR gm.id::text = ANY(task_row.assigned_member_ids)
          )
    );
$$;

-- 4. RLS para actualizar tareas:
-- Cualquier miembro del grupo puede editar detalles generales o reasignar,
-- pero SOLO el usuario asignado puede marcarla como completada (completed = true)
DROP POLICY IF EXISTS "Users can modify group tasks" ON public.tasks;

-- Política de UPDATE en public.tasks
CREATE POLICY "Users can update group tasks" ON public.tasks
    FOR UPDATE TO authenticated
    USING (
        group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
        OR created_by = auth.uid()
    )
    WITH CHECK (
        -- Si no se está marcando como completada, o ya estaba completada, permitir a miembros del grupo
        (completed IS NOT TRUE)
        -- Si se está marcando como completada, el usuario actual debe ser el asignado
        OR public.is_task_assigned_to_user(tasks, auth.uid())
    );

-- Política de INSERT en public.tasks
CREATE POLICY "Users can insert group tasks" ON public.tasks
    FOR INSERT TO authenticated
    WITH CHECK (
        (
            group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
            OR created_by = auth.uid()
        )
        AND points >= 10
    );

-- Política de DELETE en public.tasks
CREATE POLICY "Users can delete group tasks" ON public.tasks
    FOR DELETE TO authenticated
    USING (
        group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
        OR created_by = auth.uid()
    );
