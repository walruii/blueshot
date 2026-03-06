-- Fix Better Auth TEXT user IDs for RLS/realtime
-- auth.uid() expects UUID and fails when JWT sub is non-UUID text

CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT auth.jwt()->>'sub';
$$;
