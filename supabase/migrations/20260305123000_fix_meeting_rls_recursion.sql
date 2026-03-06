-- Fix recursive RLS evaluation for meeting and meeting_participant policies
-- Applies to environments where previous policies were already created.

-- Ensure helper exists (safe to re-run)
CREATE OR REPLACE FUNCTION public.can_access_meeting(
  p_meeting_id UUID,
  p_user_id TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM "public"."meeting" m
    WHERE m.id = p_meeting_id
      AND (
        m.creator_id = p_user_id
        OR EXISTS (
          SELECT 1
          FROM "public"."meeting_participant" mp
          WHERE mp.meeting_id = p_meeting_id
            AND mp.user_id = p_user_id
        )
      )
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

ALTER FUNCTION public.can_access_meeting(UUID, TEXT) SET search_path = public;

-- Recreate meeting read policy to avoid direct policy recursion through meeting_participant
DROP POLICY IF EXISTS "authenticated_read_meetings" ON "public"."meeting";
CREATE POLICY "authenticated_read_meetings" ON "public"."meeting"
FOR SELECT
TO authenticated
USING (
  (SELECT auth.role()) = 'authenticated'
  AND public.can_access_meeting(id, public.current_user_id())
);

-- Recreate meeting_participant read policy without self-reference
DROP POLICY IF EXISTS "authenticated_read_meeting_participants" ON "public"."meeting_participant";
CREATE POLICY "authenticated_read_meeting_participants" ON "public"."meeting_participant"
FOR SELECT
TO authenticated
USING (
  (SELECT auth.role()) = 'authenticated'
  AND public.can_access_meeting(meeting_id, public.current_user_id())
);

-- Keep update policy strict to own participant row only
DROP POLICY IF EXISTS "authenticated_update_own_participant_meeting" ON "public"."meeting_participant";
CREATE POLICY "authenticated_update_own_participant_meeting" ON "public"."meeting_participant"
FOR UPDATE
TO authenticated
USING (
  (SELECT auth.role()) = 'authenticated'
  AND user_id = public.current_user_id()
)
WITH CHECK (
  (SELECT auth.role()) = 'authenticated'
  AND user_id = public.current_user_id()
);

-- Recreate message policies to rely on helper for meeting access path
DROP POLICY IF EXISTS "authenticated_read_messages" ON "public"."message";
CREATE POLICY "authenticated_read_messages" ON "public"."message"
FOR SELECT
TO authenticated
USING (
  (SELECT auth.role()) = 'authenticated'
  AND (
    (conversation_id IS NOT NULL AND check_conversation_access(public.current_user_id(), conversation_id))
    OR
    (meeting_id IS NOT NULL AND public.can_access_meeting(meeting_id, public.current_user_id()))
  )
);

DROP POLICY IF EXISTS "authenticated_insert_messages" ON "public"."message";
CREATE POLICY "authenticated_insert_messages" ON "public"."message"
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.role()) = 'authenticated'
  AND sender_id = public.current_user_id()
  AND (
    (conversation_id IS NOT NULL AND check_conversation_access(public.current_user_id(), conversation_id))
    OR
    (meeting_id IS NOT NULL AND public.can_access_meeting(meeting_id, public.current_user_id()))
  )
);
