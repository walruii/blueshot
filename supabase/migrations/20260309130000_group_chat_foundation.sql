-- Group chat foundation:
-- 1) allow event_group conversations
-- 2) allow multiple conversations per user_group/event
-- 3) keep access checks aligned in check_conversation_access

ALTER TABLE public.conversation
ADD COLUMN IF NOT EXISTS event_group_id uuid REFERENCES public.event_group(id) ON DELETE CASCADE;

DROP INDEX IF EXISTS public.conversations_user_group_unique;
DROP INDEX IF EXISTS public.conversations_event_unique;

DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.conversation'::regclass
      AND contype = 'c'
      AND conname IN ('valid_polymorphic_reference', 'conversations_type_check', 'conversation_type_check')
  LOOP
    EXECUTE format('ALTER TABLE public.conversation DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE public.conversation
ADD CONSTRAINT conversation_type_check
CHECK (type IN ('direct', 'user_group', 'event', 'event_group'));

ALTER TABLE public.conversation
ADD CONSTRAINT valid_polymorphic_reference
CHECK (
  (type = 'direct' AND user_group_id IS NULL AND event_id IS NULL AND event_group_id IS NULL) OR
  (type = 'user_group' AND user_group_id IS NOT NULL AND event_id IS NULL AND event_group_id IS NULL) OR
  (type = 'event' AND event_id IS NOT NULL AND user_group_id IS NULL AND event_group_id IS NULL) OR
  (type = 'event_group' AND event_group_id IS NOT NULL AND user_group_id IS NULL AND event_id IS NULL)
);

CREATE INDEX IF NOT EXISTS conversation_event_group_id_idx
ON public.conversation USING btree (event_group_id);

CREATE OR REPLACE FUNCTION public.check_conversation_access(
  p_user_id text,
  p_conversation_id uuid
)
RETURNS boolean AS $$
DECLARE
  v_type text;
  v_has_access boolean := false;
BEGIN
  SELECT type INTO v_type
  FROM public.conversation
  WHERE id = p_conversation_id;

  IF v_type IS NULL THEN
    RETURN false;
  END IF;

  IF v_type = 'direct' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.conversation_participant
      WHERE conversation_id = p_conversation_id
        AND user_id = p_user_id
    ) INTO v_has_access;

  ELSIF v_type = 'user_group' THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.conversation c
      INNER JOIN public.user_group_member ugm
        ON ugm.user_group_id = c.user_group_id
      WHERE c.id = p_conversation_id
        AND ugm.user_id = p_user_id
    ) INTO v_has_access;

  ELSIF v_type = 'event' THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.conversation c
      INNER JOIN public.event_user_state eus
        ON eus.event_id = c.event_id
      WHERE c.id = p_conversation_id
        AND eus.user_id = p_user_id
      UNION
      SELECT 1
      FROM public.conversation c
      INNER JOIN public.event e
        ON e.id = c.event_id
      INNER JOIN public.event_group_access ega
        ON ega.event_group_id = e.event_group_id
      LEFT JOIN public.user_group_member ugm
        ON ugm.user_group_id = ega.user_group_id
      WHERE c.id = p_conversation_id
        AND (
          ega.user_id = p_user_id
          OR ugm.user_id = p_user_id
          OR e.created_by = p_user_id
        )
    ) INTO v_has_access;

  ELSIF v_type = 'event_group' THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.conversation c
      INNER JOIN public.event_group eg
        ON eg.id = c.event_group_id
      LEFT JOIN public.event_group_access ega
        ON ega.event_group_id = eg.id
      LEFT JOIN public.user_group_member ugm
        ON ugm.user_group_id = ega.user_group_id
      WHERE c.id = p_conversation_id
        AND (
          eg.created_by = p_user_id
          OR ega.user_id = p_user_id
          OR ugm.user_id = p_user_id
        )
    ) INTO v_has_access;
  END IF;

  RETURN v_has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION public.check_conversation_access(text, uuid) SET search_path = public;
