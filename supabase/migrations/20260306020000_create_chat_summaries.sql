-- Chat Summaries for AI-powered recursive summarization
-- Supports both conversation-based and meeting-based summaries

-- ============================================================================
-- CREATE CHAT_SUMMARIES TABLE
-- ============================================================================

CREATE TABLE "public"."chat_summaries" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "conversation_id" UUID REFERENCES "public"."conversation"("id") ON DELETE CASCADE,
    "meeting_id" UUID REFERENCES "public"."meeting"("id") ON DELETE CASCADE,
    "user_id" TEXT NOT NULL REFERENCES "public"."user"("id") ON DELETE CASCADE,
    "content" TEXT NOT NULL,
    "last_message_id" UUID NOT NULL REFERENCES "public"."message"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Ensure exactly one of conversation_id or meeting_id is set (polymorphic)
    CONSTRAINT "valid_summary_reference" CHECK (
        (conversation_id IS NOT NULL AND meeting_id IS NULL) OR
        (conversation_id IS NULL AND meeting_id IS NOT NULL)
    ),

    -- Each user can have only one summary per conversation
    CONSTRAINT "chat_summaries_conversation_user_unique" UNIQUE ("conversation_id", "user_id"),

    -- Each user can have only one summary per meeting
    CONSTRAINT "chat_summaries_meeting_user_unique" UNIQUE ("meeting_id", "user_id")
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX "chat_summaries_conversation_id_idx" ON "public"."chat_summaries" USING btree ("conversation_id");
CREATE INDEX "chat_summaries_meeting_id_idx" ON "public"."chat_summaries" USING btree ("meeting_id");
CREATE INDEX "chat_summaries_user_id_idx" ON "public"."chat_summaries" USING btree ("user_id");
CREATE INDEX "chat_summaries_updated_at_idx" ON "public"."chat_summaries" USING btree ("updated_at" DESC);
CREATE INDEX "chat_summaries_last_message_id_idx" ON "public"."chat_summaries" USING btree ("last_message_id");

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE "public"."chat_summaries" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Service role: Full access to all summaries
CREATE POLICY "service_role_all_chat_summaries" ON "public"."chat_summaries"
FOR ALL
TO service_role
USING ((SELECT auth.role()) = 'service_role')
WITH CHECK ((SELECT auth.role()) = 'service_role');

-- Authenticated users: Read their own summaries only
CREATE POLICY "authenticated_read_own_chat_summaries" ON "public"."chat_summaries"
FOR SELECT
TO authenticated
USING (
    (SELECT auth.role()) = 'authenticated'
    AND user_id = public.current_user_id()
);

-- Authenticated users: Insert their own summaries only
CREATE POLICY "authenticated_insert_own_chat_summaries" ON "public"."chat_summaries"
FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT auth.role()) = 'authenticated'
    AND user_id = public.current_user_id()
);

-- Authenticated users: Update their own summaries only
CREATE POLICY "authenticated_update_own_chat_summaries" ON "public"."chat_summaries"
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

-- Authenticated users: Delete their own summaries only
CREATE POLICY "authenticated_delete_own_chat_summaries" ON "public"."chat_summaries"
FOR DELETE
TO authenticated
USING (
    (SELECT auth.role()) = 'authenticated'
    AND user_id = public.current_user_id()
);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON "public"."chat_summaries" TO service_role;
GRANT ALL ON "public"."chat_summaries" TO postgres;
