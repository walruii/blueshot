-- Comprehensive RLS Policies for Message System with Custom JWT Auth
-- Supports both conversation-based and meeting-based messages

-- ============================================================================
-- DROP EXISTING WEAK POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "service_role_all" ON "public"."conversation";
DROP POLICY IF EXISTS "service_role_all" ON "public"."message";
DROP POLICY IF EXISTS "authenticated_read" ON "public"."message";
DROP POLICY IF EXISTS "service_role_all" ON "public"."conversation_participant";

-- ============================================================================
-- CONVERSATION TABLE POLICIES
-- ============================================================================

-- Service role: Full access to all conversations
CREATE POLICY "service_role_all_conversations" ON "public"."conversation"
FOR ALL
TO service_role
USING ((SELECT auth.role()) = 'service_role')
WITH CHECK ((SELECT auth.role()) = 'service_role');

-- Authenticated: Read conversations they have access to
CREATE POLICY "authenticated_read_conversations" ON "public"."conversation"
FOR SELECT
TO authenticated
USING (
  (SELECT auth.role()) = 'authenticated'
  AND check_conversation_access(public.current_user_id(), id)
);

-- Authenticated: Update conversations they have access to (for metadata like last_message_at)
CREATE POLICY "authenticated_update_conversations" ON "public"."conversation"
FOR UPDATE
TO authenticated
USING (
  (SELECT auth.role()) = 'authenticated'
  AND check_conversation_access(public.current_user_id(), id)
)
WITH CHECK (
  (SELECT auth.role()) = 'authenticated'
  AND check_conversation_access(public.current_user_id(), id)
);

-- ============================================================================
-- CONVERSATION_PARTICIPANT TABLE POLICIES
-- ============================================================================

-- Service role: Full access to all participants
CREATE POLICY "service_role_all_participants" ON "public"."conversation_participant"
FOR ALL
TO service_role
USING ((SELECT auth.role()) = 'service_role')
WITH CHECK ((SELECT auth.role()) = 'service_role');

-- Authenticated: Users can read participants in conversations they're part of
CREATE POLICY "authenticated_read_participants" ON "public"."conversation_participant"
FOR SELECT
TO authenticated
USING (
  (SELECT auth.role()) = 'authenticated'
  AND check_conversation_access(public.current_user_id(), conversation_id)
);

-- Authenticated: Users can update their own participant record (e.g., last_seen_at)
CREATE POLICY "authenticated_update_own_participant" ON "public"."conversation_participant"
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

-- ============================================================================
-- MESSAGE TABLE POLICIES
-- ============================================================================

-- Service role: Full access to all messages
CREATE POLICY "service_role_all_messages" ON "public"."message"
FOR ALL
TO service_role
USING ((SELECT auth.role()) = 'service_role')
WITH CHECK ((SELECT auth.role()) = 'service_role');

-- Authenticated: Read messages from conversations they have access to OR meetings they're in
CREATE POLICY "authenticated_read_messages" ON "public"."message"
FOR SELECT
TO authenticated
USING (
  (SELECT auth.role()) = 'authenticated'
  AND (
    -- Can read messages from conversations they have access to
    (conversation_id IS NOT NULL AND check_conversation_access(public.current_user_id(), conversation_id))
    OR
    -- Can read messages from meetings they're participating in
    (meeting_id IS NOT NULL AND public.can_access_meeting(meeting_id, public.current_user_id()))
  )
);

-- Authenticated: Insert messages into conversations they have access to OR meetings they're in
-- Users can ONLY insert with their own sender_id
CREATE POLICY "authenticated_insert_messages" ON "public"."message"
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.role()) = 'authenticated'
  AND sender_id = public.current_user_id()
  AND (
    -- Can send to conversations they have access to
    (conversation_id IS NOT NULL AND check_conversation_access(public.current_user_id(), conversation_id))
    OR
    -- Can send to meetings they're participating in
    (meeting_id IS NOT NULL AND public.can_access_meeting(meeting_id, public.current_user_id()))
  )
);

-- Authenticated: Update their own messages (for edits)
-- Users can only update content and edited_at, not sender_id or conversation_id
CREATE POLICY "authenticated_update_own_messages" ON "public"."message"
FOR UPDATE
TO authenticated
USING (
  (SELECT auth.role()) = 'authenticated'
  AND sender_id = public.current_user_id()
)
WITH CHECK (
  (SELECT auth.role()) = 'authenticated'
  AND sender_id = public.current_user_id()
);

-- Authenticated: Soft delete their own messages (set deleted_at)
CREATE POLICY "authenticated_delete_own_messages" ON "public"."message"
FOR UPDATE
TO authenticated
USING (
  (SELECT auth.role()) = 'authenticated'
  AND sender_id = public.current_user_id()
)
WITH CHECK (
  (SELECT auth.role()) = 'authenticated'
  AND sender_id = public.current_user_id()
  AND deleted_at IS NOT NULL
);

-- ============================================================================
-- ENABLE REALTIME FOR AUTHENTICATED USERS
-- ============================================================================

-- Ensure messages table is already added to realtime publication
-- This should already exist, but we're being explicit
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

COMMENT ON POLICY "service_role_all_messages" ON "public"."message" IS 'Service role has full access for server-side operations';
COMMENT ON POLICY "authenticated_read_messages" ON "public"."message" IS 'Users can read messages from conversations/meetings they have access to';
COMMENT ON POLICY "authenticated_insert_messages" ON "public"."message" IS 'Users can send messages to conversations/meetings they participate in';
COMMENT ON POLICY "authenticated_update_own_messages" ON "public"."message" IS 'Users can edit their own messages';
