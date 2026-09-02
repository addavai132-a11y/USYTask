-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text,
  date_of_birth date,
  profile_completed boolean DEFAULT false,
  notifications_enabled boolean DEFAULT false,
  usytask_cloud_backup jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Function to handle new user insertion
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, date_of_birth, profile_completed, notifications_enabled, usytask_cloud_backup)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    (NEW.raw_user_meta_data->>'date_of_birth')::date,
    COALESCE((NEW.raw_user_meta_data->>'profile_completed')::boolean, false),
    COALESCE((NEW.raw_user_meta_data->>'notifications_enabled')::boolean, false),
    NEW.raw_user_meta_data->'usytask_cloud_backup'
  );
  RETURN NEW;
END;
$$;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Idempotent insertion for existing users
INSERT INTO public.profiles (id, username, date_of_birth, profile_completed, notifications_enabled, usytask_cloud_backup)
SELECT 
  id,
  raw_user_meta_data->>'username',
  NULLIF(raw_user_meta_data->>'date_of_birth', '')::date,
  COALESCE((raw_user_meta_data->>'profile_completed')::boolean, false),
  COALESCE((raw_user_meta_data->>'notifications_enabled')::boolean, false),
  raw_user_meta_data->'usytask_cloud_backup'
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  date_of_birth = EXCLUDED.date_of_birth,
  profile_completed = EXCLUDED.profile_completed,
  notifications_enabled = EXCLUDED.notifications_enabled,
  usytask_cloud_backup = EXCLUDED.usytask_cloud_backup;
