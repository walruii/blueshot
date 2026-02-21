-- Chat system

CREATE TABLE "public"."conversations" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL CHECK (type IN ('direct', 'user_group', 'event')),
    "user_group_id" UUID REFERENCES "public"."user_group"("id") ON DELETE CASCADE,
    "event_id" UUID REFERENCES "public"."event"("id") ON DELETE CASCADE,
    "name" TEXT,
    "description" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "last_message_at" TIMESTAMPTZ,
    CONSTRAINT "valid_polymorphic_reference" CHECK (
        (type = 'direct' AND user_group_id IS NULL AND event_id IS NULL) OR
        (type = 'user_group' AND user_group_id IS NOT NULL AND event_id IS NULL) OR
        (type = 'event' AND event_id IS NOT NULL AND user_group_id IS NULL)
    )
);

CREATE INDEX "conversations_type_idx" ON "public"."conversations" USING btree ("type");
CREATE INDEX "conversations_user_group_id_idx" ON "public"."conversations" USING btree ("user_group_id");
CREATE INDEX "conversations_event_id_idx" ON "public"."conversations" USING btree ("event_id");
CREATE INDEX "conversations_last_message_at_idx" ON "public"."conversations" USING btree ("last_message_at" DESC NULLS LAST);
CREATE UNIQUE INDEX "conversations_event_unique" ON "public"."conversations" USING btree ("event_id") WHERE event_id IS NOT NULL;
CREATE UNIQUE INDEX "conversations_user_group_unique" ON "public"."conversations" USING btree ("user_group_id") WHERE user_group_id IS NOT NULL;

CREATE TABLE "public"."messages" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "conversation_id" UUID NOT NULL REFERENCES "public"."conversations"("id") ON DELETE CASCADE,
    "sender_id" TEXT NOT NULL REFERENCES "public"."user"("id") ON DELETE CASCADE,
    "content" TEXT NOT NULL,
    "content_type" TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'file', 'system')),
    "reply_to_id" UUID REFERENCES "public"."messages"("id") ON DELETE SET NULL,
    "edited_at" TIMESTAMPTZ,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "meeting_id" UUID REFERENCES "public"."meetings"("id") ON DELETE SET NULL,
    "sent_during_meeting" BOOLEAN DEFAULT false
);

CREATE INDEX "messages_conversation_id_idx" ON "public"."messages" USING btree ("conversation_id");
CREATE INDEX "messages_sender_id_idx" ON "public"."messages" USING btree ("sender_id");
CREATE INDEX "messages_created_at_idx" ON "public"."messages" USING btree ("created_at" DESC);
CREATE INDEX "messages_meeting_id_idx" ON "public"."messages" USING btree ("meeting_id");
CREATE INDEX "messages_conversation_created_idx" ON "public"."messages" USING btree ("conversation_id", "created_at" DESC);
CREATE INDEX "messages_reply_to_id_idx" ON "public"."messages" USING btree ("reply_to_id");

CREATE TABLE "public"."conversation_participants" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "conversation_id" UUID NOT NULL REFERENCES "public"."conversations"("id") ON DELETE CASCADE,
    "user_id" TEXT NOT NULL REFERENCES "public"."user"("id") ON DELETE CASCADE,
    "role" TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin', 'owner')),
    "can_send_messages" BOOLEAN DEFAULT true,
    "can_add_participants" BOOLEAN DEFAULT false,
    "joined_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "last_seen_at" TIMESTAMPTZ,
    "last_read_message_id" UUID REFERENCES "public"."messages"("id") ON DELETE SET NULL,
    "notifications_enabled" BOOLEAN DEFAULT true,
    "muted_until" TIMESTAMPTZ,
    CONSTRAINT "conversation_participants_unique" UNIQUE ("conversation_id", "user_id")
);

CREATE INDEX "conversation_participants_conversation_id_idx" ON "public"."conversation_participants" USING btree ("conversation_id");
CREATE INDEX "conversation_participants_user_id_idx" ON "public"."conversation_participants" USING btree ("user_id");
CREATE INDEX "conversation_participants_last_seen_idx" ON "public"."conversation_participants" USING btree ("user_id", "last_seen_at");
CREATE INDEX "conversation_participants_last_read_message_id_idx" ON "public"."conversation_participants" USING btree ("last_read_message_id");

CREATE OR REPLACE FUNCTION "public"."update_conversation_last_message"()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET
        last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "update_conversation_last_message_trigger"
AFTER INSERT ON "public"."messages"
FOR EACH ROW
EXECUTE FUNCTION "public"."update_conversation_last_message"();

CREATE OR REPLACE FUNCTION "public"."check_conversation_access"(
    p_user_id TEXT,
    p_conversation_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_type TEXT;
    v_has_access BOOLEAN := false;
BEGIN
    SELECT type INTO v_type
    FROM conversations
    WHERE id = p_conversation_id;

    IF v_type IS NULL THEN
        RETURN false;
    END IF;

    IF v_type = 'direct' THEN
        SELECT EXISTS (
            SELECT 1 FROM conversation_participants
            WHERE conversation_id = p_conversation_id
            AND user_id = p_user_id
        ) INTO v_has_access;
    ELSIF v_type = 'user_group' THEN
        SELECT EXISTS (
            SELECT 1 FROM conversations c
            INNER JOIN user_group_member ugm ON ugm.user_group_id = c.user_group_id
            WHERE c.id = p_conversation_id
            AND ugm.user_id = p_user_id
        ) INTO v_has_access;
    ELSIF v_type = 'event' THEN
        SELECT EXISTS (
            SELECT 1 FROM conversations c
            INNER JOIN event_user_state use ON use.event_id = c.event_id
            WHERE c.id = p_conversation_id
            AND use.user_id = p_user_id
            UNION
            SELECT 1 FROM conversations c
            INNER JOIN event e ON e.id = c.event_id
            INNER JOIN event_group_access ega ON ega.event_group_id = e.event_group_id
            INNER JOIN user_group_member ugm ON ugm.user_group_id = ega.user_group_id
            WHERE c.id = p_conversation_id
            AND ugm.user_id = p_user_id
        ) INTO v_has_access;
    END IF;

    RETURN v_has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION "public"."update_conversation_last_message"() SET search_path = "public";
ALTER FUNCTION "public"."check_conversation_access"("text", "uuid") SET search_path = "public";

ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."conversation_participants" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON "public"."conversations"
FOR ALL
TO service_role
USING ((select auth.role()) = 'service_role')
WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "service_role_all" ON "public"."messages"
FOR ALL
TO service_role
USING ((select auth.role()) = 'service_role')
WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "authenticated_read" ON "public"."messages"
FOR SELECT
TO authenticated
USING ((select auth.role()) = 'authenticated');

CREATE POLICY "service_role_all" ON "public"."conversation_participants"
FOR ALL
TO service_role
USING ((select auth.role()) = 'service_role')
WITH CHECK ((select auth.role()) = 'service_role');

ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."messages";
