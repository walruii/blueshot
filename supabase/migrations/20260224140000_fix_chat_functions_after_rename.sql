-- Fix chat triggers/functions after renaming tables:
-- conversations -> conversation
-- messages -> message
-- conversation_participants -> conversation_participant

CREATE OR REPLACE FUNCTION "public"."update_conversation_last_message"()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE "public"."conversation"
  SET
    last_message_at = NEW.created_at,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "update_conversation_last_message_trigger" ON "public"."message";

CREATE TRIGGER "update_conversation_last_message_trigger"
AFTER INSERT ON "public"."message"
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
  FROM "public"."conversation"
  WHERE id = p_conversation_id;

  IF v_type IS NULL THEN
    RETURN false;
  END IF;

  IF v_type = 'direct' THEN
    SELECT EXISTS (
      SELECT 1 FROM "public"."conversation_participant"
      WHERE conversation_id = p_conversation_id
        AND user_id = p_user_id
    ) INTO v_has_access;
  ELSIF v_type = 'user_group' THEN
    SELECT EXISTS (
      SELECT 1
      FROM "public"."conversation" c
      INNER JOIN "public"."user_group_member" ugm
        ON ugm.user_group_id = c.user_group_id
      WHERE c.id = p_conversation_id
        AND ugm.user_id = p_user_id
    ) INTO v_has_access;
  ELSIF v_type = 'event' THEN
    SELECT EXISTS (
      SELECT 1
      FROM "public"."conversation" c
      INNER JOIN "public"."event_user_state" eus
        ON eus.event_id = c.event_id
      WHERE c.id = p_conversation_id
        AND eus.user_id = p_user_id
      UNION
      SELECT 1
      FROM "public"."conversation" c
      INNER JOIN "public"."event" e
        ON e.id = c.event_id
      INNER JOIN "public"."event_group_access" ega
        ON ega.event_group_id = e.event_group_id
      INNER JOIN "public"."user_group_member" ugm
        ON ugm.user_group_id = ega.user_group_id
      WHERE c.id = p_conversation_id
        AND ugm.user_id = p_user_id
    ) INTO v_has_access;
  END IF;

  RETURN v_has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION "public"."update_conversation_last_message"() SET search_path = "public";
ALTER FUNCTION "public"."check_conversation_access"(TEXT, UUID) SET search_path = "public";

