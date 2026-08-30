-- Migration: Recurring Subscriptions, Incomes, and Expenses Schema
-- Date: 2026-08-30

-- 1. Actualizar tabla de facturas / suscripciones
ALTER TABLE IF EXISTS public.bills
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'activa',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS due_day INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'mensual',
  ADD COLUMN IF NOT EXISTS autopay BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_generated_month TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Actualizar tabla de gastos (Expenses)
ALTER TABLE IF EXISTS public.expenses
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS billing_day INT,
  ADD COLUMN IF NOT EXISTS subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Actualizar tabla de ingresos (Incomes / Nóminas)
ALTER TABLE IF EXISTS public.incomes
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS billing_day INT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Índices para acelerar búsquedas y generación mensual anti-duplicados
CREATE INDEX IF NOT EXISTS idx_expenses_subscription ON public.expenses (group_id, subscription_id, date);
CREATE INDEX IF NOT EXISTS idx_incomes_recurring ON public.incomes (group_id, is_recurring, date);
CREATE INDEX IF NOT EXISTS idx_bills_group_status ON public.bills (group_id, subscription_status, is_active);
