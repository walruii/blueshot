CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT auth.uid()::text;
$$;


-- 1. Optimized SQL function (faster than plpgsql for RLS)
CREATE OR REPLACE FUNCTION public.can_access_meeting(
  p_meeting_id UUID,
  p_user_id TEXT
)
RETURNS BOOLEAN
LANGUAGE sql -- Changed to SQL for inlining
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.meeting m
    WHERE m.id = p_meeting_id
      AND (
        m.creator_id = p_user_id
        OR EXISTS (
          SELECT 1
          FROM public.meeting_participant mp
          WHERE mp.meeting_id = p_meeting_id
            AND mp.user_id = p_user_id
        )
      )
  );
$$;

-- 2. Enable FULL identity for Realtime
ALTER TABLE "public"."message" REPLICA IDENTITY FULL;

-- 3. Consolidated Policies
-- Note: Added 'public.' prefix to current_user_id for consistency

CREATE POLICY "authenticated_select_messages" ON "public"."message"
FOR SELECT TO authenticated
USING (
  (conversation_id IS NOT NULL AND public.check_conversation_access(public.current_user_id(), conversation_id))
  OR
  (meeting_id IS NOT NULL AND public.can_access_meeting(meeting_id, public.current_user_id()))
);

CREATE POLICY "authenticated_insert_messages" ON "public"."message"
FOR INSERT TO authenticated
WITH CHECK (
  sender_id = public.current_user_id()
  AND (
    (conversation_id IS NOT NULL AND public.check_conversation_access(public.current_user_id(), conversation_id))
    OR
    (meeting_id IS NOT NULL AND public.can_access_meeting(meeting_id, public.current_user_id()))
  )
);

-- Enhanced Update policy to ensure room access is maintained
CREATE POLICY "authenticated_update_messages" ON "public"."message"
FOR UPDATE TO authenticated
USING (
  sender_id = public.current_user_id()
  AND (
    (conversation_id IS NOT NULL AND public.check_conversation_access(public.current_user_id(), conversation_id))
    OR
    (meeting_id IS NOT NULL AND public.can_access_meeting(meeting_id, public.current_user_id()))
  )
);

-- 4. Realtime Publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'message'
  ) THEN
    ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."message";
  END IF;
END $$;
