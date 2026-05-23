


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."access" AS ENUM (
    'admin',
    'read',
    'read_write'
);


ALTER TYPE "public"."access" OWNER TO "postgres";


CREATE TYPE "public"."event_status" AS ENUM (
    'cancel',
    'archive',
    'default'
);


ALTER TYPE "public"."event_status" OWNER TO "postgres";


CREATE TYPE "public"."event_type" AS ENUM (
    'allday',
    'default'
);


ALTER TYPE "public"."event_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_access_meeting"("p_meeting_id" "uuid", "p_user_id" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."can_access_meeting"("p_meeting_id" "uuid", "p_user_id" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."can_access_meeting"("p_meeting_id" "uuid", "p_user_id" "text") IS 'Checks whether a user can access a meeting (creator or participant) without recursive RLS policy evaluation';



CREATE OR REPLACE FUNCTION "public"."check_conversation_access"("p_user_id" "text", "p_conversation_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."check_conversation_access"("p_user_id" "text", "p_conversation_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_id"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  SELECT auth.jwt()->>'sub';
$$;


ALTER FUNCTION "public"."current_user_id"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."current_user_id"() IS 'Returns the current authenticated user ID from the JWT sub claim (Better Auth integration)';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."event_group" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "created_by" "text" NOT NULL
);


ALTER TABLE "public"."event_group" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_accessible_event_groups"("p_user_id" "text") RETURNS SETOF "public"."event_group"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    -- 1. OWNER: Direct ownership
    SELECT * FROM event_group
    WHERE created_by = p_user_id

    UNION

    -- 2. USER GROUPS: Permission via a group the user belongs to
    SELECT eg.* FROM event_group eg
    JOIN event_group_access ega ON eg.id = ega.event_group_id
    JOIN user_group_member ugm ON ega.user_group_id = ugm.user_group_id
    WHERE ugm.user_id = p_user_id
      AND ega.role >= 3

    UNION

    -- 3. DIRECT: Permission directly in the event_group_access table
    SELECT eg.* FROM event_group eg
    JOIN event_group_access ega ON eg.id = ega.event_group_id
    WHERE ega.user_id = p_user_id
      AND ega.role >= 3;
END;
$$;


ALTER FUNCTION "public"."get_accessible_event_groups"("p_user_id" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_group" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "created_by" "text" NOT NULL
);


ALTER TABLE "public"."user_group" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_accessible_user_groups"("p_user_id" "text") RETURNS SETOF "public"."user_group"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    -- 1. Get groups created by the user (Ownership)
    SELECT * FROM user_group
    WHERE created_by = p_user_id

    UNION

    -- 2. Get groups the user is a member of (Membership)
    -- We join the membership table to the group table to get the full rows
    SELECT ug.* FROM user_group ug
    JOIN user_group_member ugm ON ug.id = ugm.user_group_id
    WHERE ugm.user_id = p_user_id;
END;
$$;


ALTER FUNCTION "public"."get_accessible_user_groups"("p_user_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_active_events"("requesting_user_id" "text") RETURNS TABLE("id" "uuid", "title" "text", "description" "text", "from" timestamp with time zone, "to" timestamp with time zone, "created_by" "text", "created_at" timestamp with time zone, "type" "public"."event_type", "status" "public"."event_status", "event_group_id" "uuid", "event_meeting_id" "uuid", "event_user_name" "text", "event_user_email" "text", "user_role" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id, 
        e.title, 
        e.description, 
        e.from, 
        e.to, 
        e.created_by, 
        e.created_at, 
        e.type, 
        e.status, 
        e.event_group_id,
        e.meeting_id as event_meeting_id,
        u.name as event_user_name, 
        u.email as event_user_email,
        vae.role as user_role
    FROM event e
    LEFT JOIN "user" u ON e.created_by = u.id
    -- Securely join to the access view
    INNER JOIN view_all_event_access vae ON e.id = vae.event_id
    WHERE vae.user_id::TEXT = requesting_user_id
      AND (e."to" > NOW() OR e."to" IS NULL)
    ORDER BY e."from" ASC;
END;
$$;


ALTER FUNCTION "public"."get_active_events"("requesting_user_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_event"("target_event_id" "uuid", "requesting_user_id" "text") RETURNS TABLE("id" "uuid", "title" "text", "description" "text", "from" timestamp with time zone, "to" timestamp with time zone, "created_by" "text", "created_at" timestamp with time zone, "type" "public"."event_type", "status" "public"."event_status", "event_group_id" "uuid", "event_user_name" "text", "event_user_email" "text", "event_meeting_id" "uuid", "user_role" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id, 
        e.title, 
        e.description, 
        e.from, 
        e.to, 
        e.created_by::TEXT, -- Explicitly cast to TEXT just in case
        e.created_at, 
        e.type, 
        e.status, 
        e.event_group_id, 
        u.name as event_user_name, 
        u.email as event_user_email,
        e.meeting_id as event_meeting_id,
        vae.role as user_role
    FROM event e
    LEFT JOIN "user" u ON e.created_by = u.id
    INNER JOIN view_all_event_access vae ON e.id = vae.event_id
    WHERE e.id = target_event_id
      AND vae.user_id = requesting_user_id
    LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."get_event"("target_event_id" "uuid", "requesting_user_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_event_members"("target_event_id" "uuid") RETURNS TABLE("acknowledged_at" timestamp with time zone, "created_at" timestamp with time zone, "event_id" "uuid", "event_sent_at" timestamp with time zone, "id" "uuid", "user_id" "text", "user_name" "text", "user_email" "text")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        eus.acknowledged_at,
        eus.created_at,
        eus.event_id,
        eus.event_sent_at,
        eus.id,
        eus.user_id,
        u.email as user_email, u.name as user_name
    FROM event_user_state eus
    LEFT JOIN "user" u ON u.id = eus.user_id
    WHERE eus.event_id = target_event_id
      AND EXISTS (
          SELECT 1
          FROM view_all_event_access vae
          WHERE vae.event_id = target_event_id
      );
END;
$$;


ALTER FUNCTION "public"."get_event_members"("target_event_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_existing_direct_conversation"("user_a" "text", "user_b" "text") RETURNS "uuid"
    LANGUAGE "sql"
    AS $$
  SELECT cp1.conversation_id
  FROM conversation_participant cp1
  JOIN conversation_participant cp2 ON cp1.conversation_id = cp2.conversation_id
  JOIN conversation c ON c.id = cp1.conversation_id
  WHERE cp1.user_id = user_a 
    AND cp2.user_id = user_b 
    AND c.type = 'direct'
  LIMIT 1;
$$;


ALTER FUNCTION "public"."get_existing_direct_conversation"("user_a" "text", "user_b" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_user_state" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "event_sent_at" timestamp with time zone,
    "acknowledged_at" timestamp with time zone
);


ALTER TABLE "public"."event_user_state" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_event_state"("target_event_id" "uuid", "requesting_user_id" "text") RETURNS SETOF "public"."event_user_state"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT eus.*
    FROM event_user_state eus
    WHERE eus.event_id = target_event_id
      AND eus.user_id = requesting_user_id
      AND EXISTS (
          SELECT 1
          FROM view_all_event_access vae
          WHERE vae.event_id = target_event_id
            AND vae.user_id = requesting_user_id
      );
END;
$$;


ALTER FUNCTION "public"."get_user_event_state"("target_event_id" "uuid", "requesting_user_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_events"("request_id" "text") RETURNS TABLE("id" "uuid", "title" "text", "description" "text", "from" timestamp with time zone, "to" timestamp with time zone, "created_by" "text", "created_at" timestamp with time zone, "type" "public"."event_type", "status" "public"."event_status", "event_group_id" "uuid", "event_meeting_id" "uuid", "event_user_name" "text", "event_user_email" "text", "user_role" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT 
        e.id, 
        e.title, 
        e.description, 
        e.from, 
        e.to, 
        e.created_by, 
        e.created_at, 
        e.type, 
        e.status, 
        e.event_group_id,
        e.meeting_id as event_meeting_id, -- Mapping meeting_id
        u.name as event_user_name, 
        u.email as event_user_email,
        vae.role as user_role
    FROM event e
    LEFT JOIN "user" u ON e.created_by = u.id
    -- JOIN to your unified access view
    INNER JOIN view_all_event_access vae ON e.id = vae.event_id
    WHERE vae.user_id::TEXT = request_id; -- Ensuring text comparison
END;
$$;


ALTER FUNCTION "public"."get_user_events"("request_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_conversation_last_message"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE "public"."conversation"
  SET
    last_message_at = NEW.created_at,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_conversation_last_message"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."account" (
    "id" "text" NOT NULL,
    "accountId" "text" NOT NULL,
    "providerId" "text" NOT NULL,
    "userId" "text" NOT NULL,
    "accessToken" "text",
    "refreshToken" "text",
    "idToken" "text",
    "accessTokenExpiresAt" timestamp with time zone,
    "refreshTokenExpiresAt" timestamp with time zone,
    "scope" "text",
    "password" "text",
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE "public"."account" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_summaries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid",
    "meeting_id" "uuid",
    "user_id" "text" NOT NULL,
    "content" "text" NOT NULL,
    "last_message_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "valid_summary_reference" CHECK (((("conversation_id" IS NOT NULL) AND ("meeting_id" IS NULL)) OR (("conversation_id" IS NULL) AND ("meeting_id" IS NOT NULL))))
);


ALTER TABLE "public"."chat_summaries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversation" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "user_group_id" "uuid",
    "event_id" "uuid",
    "name" "text",
    "description" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_message_at" timestamp with time zone,
    "event_group_id" "uuid",
    CONSTRAINT "conversation_type_check" CHECK (("type" = ANY (ARRAY['direct'::"text", 'user_group'::"text", 'event'::"text", 'event_group'::"text"]))),
    CONSTRAINT "valid_polymorphic_reference" CHECK (((("type" = 'direct'::"text") AND ("user_group_id" IS NULL) AND ("event_id" IS NULL) AND ("event_group_id" IS NULL)) OR (("type" = 'user_group'::"text") AND ("user_group_id" IS NOT NULL) AND ("event_id" IS NULL) AND ("event_group_id" IS NULL)) OR (("type" = 'event'::"text") AND ("event_id" IS NOT NULL) AND ("user_group_id" IS NULL) AND ("event_group_id" IS NULL)) OR (("type" = 'event_group'::"text") AND ("event_group_id" IS NOT NULL) AND ("user_group_id" IS NULL) AND ("event_id" IS NULL))))
);


ALTER TABLE "public"."conversation" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversation_participant" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "role" "text" DEFAULT 'member'::"text",
    "can_send_messages" boolean DEFAULT true,
    "can_add_participants" boolean DEFAULT false,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_seen_at" timestamp with time zone,
    "last_read_message_id" "uuid",
    "notifications_enabled" boolean DEFAULT true,
    "muted_until" timestamp with time zone,
    CONSTRAINT "conversation_participants_role_check" CHECK (("role" = ANY (ARRAY['member'::"text", 'admin'::"text", 'owner'::"text"])))
);


ALTER TABLE "public"."conversation_participant" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "emailVerified" boolean NOT NULL,
    "image" "text",
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "twoFactorEnabled" boolean
);


ALTER TABLE "public"."user" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."direct_messages_inbox" AS
 SELECT "cp1"."user_id" AS "current_user_id",
    "c"."id",
    "c"."type",
    "c"."user_group_id",
    "c"."event_id",
    "c"."name",
    "c"."description",
    "c"."avatar_url",
    "c"."created_at",
    "c"."updated_at",
    "c"."last_message_at",
    "u"."id" AS "partner_id",
    "u"."name" AS "partner_name",
    "u"."email" AS "partner_email",
    "u"."image" AS "partner_image"
   FROM ((("public"."conversation_participant" "cp1"
     JOIN "public"."conversation" "c" ON (("cp1"."conversation_id" = "c"."id")))
     JOIN "public"."conversation_participant" "cp2" ON ((("c"."id" = "cp2"."conversation_id") AND ("cp1"."user_id" <> "cp2"."user_id"))))
     JOIN "public"."user" "u" ON (("cp2"."user_id" = "u"."id")))
  WHERE ("c"."type" = 'direct'::"text");


ALTER VIEW "public"."direct_messages_inbox" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "from" timestamp with time zone NOT NULL,
    "to" timestamp with time zone,
    "created_by" "text" NOT NULL,
    "type" "public"."event_type" NOT NULL,
    "status" "public"."event_status" NOT NULL,
    "event_group_id" "uuid" NOT NULL,
    "meeting_id" "uuid"
);


ALTER TABLE "public"."event" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_access" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "text" NOT NULL,
    "event_id" "uuid" NOT NULL,
    "role" integer NOT NULL,
    "user_group_id" "uuid"
);


ALTER TABLE "public"."event_access" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_group_access" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "event_group_id" "uuid" NOT NULL,
    "user_id" "text",
    "user_group_id" "uuid",
    "role" integer NOT NULL
);


ALTER TABLE "public"."event_group_access" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_group_member" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "text" NOT NULL,
    "user_group_id" "uuid" NOT NULL
);


ALTER TABLE "public"."user_group_member" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."group_conversations_inbox" AS
 SELECT "cp_me"."user_id" AS "current_user_id",
    "c"."avatar_url",
    "c"."created_at",
    "c"."description",
    "c"."event_group_id",
    "c"."event_id",
    "c"."id",
    "c"."last_message_at",
    "c"."name",
    COALESCE(( SELECT "json_agg"("json_build_object"('id', "u"."id", 'name', "u"."name", 'email', "u"."email", 'image', "u"."image", 'role', "cp_others"."role")) AS "json_agg"
           FROM ("public"."conversation_participant" "cp_others"
             JOIN "public"."user" "u" ON (("cp_others"."user_id" = "u"."id")))
          WHERE (("cp_others"."conversation_id" = "c"."id") AND ("cp_others"."user_id" <> "cp_me"."user_id"))), '[]'::json) AS "participants",
    "c"."type",
    "c"."updated_at",
    "c"."user_group_id",
    "cp_me"."role" AS "current_user_role",
        CASE
            WHEN ("c"."type" = 'user_group'::"text") THEN (EXISTS ( SELECT 1
               FROM "public"."user_group" "ug"
              WHERE (("ug"."id" = "c"."user_group_id") AND ("ug"."created_by" = "cp_me"."user_id"))))
            WHEN ("c"."type" = 'event_group'::"text") THEN ((EXISTS ( SELECT 1
               FROM "public"."event_group" "eg"
              WHERE (("eg"."id" = "c"."event_group_id") AND ("eg"."created_by" = "cp_me"."user_id")))) OR (EXISTS ( SELECT 1
               FROM "public"."event_group_access" "ega"
              WHERE (("ega"."event_group_id" = "c"."event_group_id") AND ("ega"."user_id" = "cp_me"."user_id") AND ("ega"."role" >= 2)))) OR (EXISTS ( SELECT 1
               FROM ("public"."event_group_access" "ega"
                 JOIN "public"."user_group_member" "ugm" ON (("ugm"."user_group_id" = "ega"."user_group_id")))
              WHERE (("ega"."event_group_id" = "c"."event_group_id") AND ("ugm"."user_id" = "cp_me"."user_id") AND ("ega"."role" >= 2)))))
            ELSE false
        END AS "current_user_can_manage"
   FROM ("public"."conversation_participant" "cp_me"
     JOIN "public"."conversation" "c" ON (("cp_me"."conversation_id" = "c"."id")))
  WHERE ("c"."type" <> 'direct'::"text");


ALTER VIEW "public"."group_conversations_inbox" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meeting" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "creator_id" "text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ended_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "room_id" "text" NOT NULL,
    "passcode" "text",
    "passcode_created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."meeting" OWNER TO "postgres";


COMMENT ON COLUMN "public"."meeting"."passcode" IS 'Randomly generated 6-character alphanumeric code for external participant access';



COMMENT ON COLUMN "public"."meeting"."passcode_created_at" IS 'Timestamp when passcode was generated';



CREATE TABLE IF NOT EXISTS "public"."meeting_event" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "meeting_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "event_data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "meeting_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['join'::"text", 'leave'::"text", 'hand_raise'::"text", 'hand_lower'::"text", 'mic_on'::"text", 'mic_off'::"text", 'camera_on'::"text", 'camera_off'::"text"])))
);


ALTER TABLE "public"."meeting_event" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meeting_participant" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "meeting_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "left_at" timestamp with time zone,
    "is_moderator" boolean DEFAULT false NOT NULL,
    "mic_enabled_at_join" boolean DEFAULT false NOT NULL,
    "camera_enabled_at_join" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "joined_via_passcode" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."meeting_participant" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meeting_transcript_segment" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "meeting_id" "uuid" NOT NULL,
    "participant_name" "text" NOT NULL,
    "text" "text" NOT NULL,
    "spoken_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."meeting_transcript_segment" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."message" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid",
    "sender_id" "text" NOT NULL,
    "content" "text" NOT NULL,
    "content_type" "text" DEFAULT 'text'::"text",
    "reply_to_id" "uuid",
    "edited_at" timestamp with time zone,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "meeting_id" "uuid",
    CONSTRAINT "messages_content_type_check" CHECK (("content_type" = ANY (ARRAY['text'::"text", 'image'::"text", 'file'::"text", 'system'::"text"])))
);

ALTER TABLE ONLY "public"."message" REPLICA IDENTITY FULL;


ALTER TABLE "public"."message" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "priority" integer DEFAULT 1 NOT NULL,
    "type" "text" NOT NULL,
    "archived" timestamp with time zone,
    "payload" "jsonb",
    "user_id" "text" NOT NULL
);


ALTER TABLE "public"."notification" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."passcode_attempt" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "meeting_id" "uuid" NOT NULL,
    "ip_address" "inet" NOT NULL,
    "attempted_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."passcode_attempt" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."passkey" (
    "id" "text" NOT NULL,
    "name" "text",
    "publicKey" "text" NOT NULL,
    "userId" "text" NOT NULL,
    "credentialID" "text" NOT NULL,
    "counter" integer NOT NULL,
    "deviceType" "text" NOT NULL,
    "backedUp" boolean NOT NULL,
    "transports" "text",
    "createdAt" timestamp with time zone,
    "aaguid" "text"
);


ALTER TABLE "public"."passkey" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."session" (
    "id" "text" NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "token" "text" NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "ipAddress" "text",
    "userAgent" "text",
    "userId" "text" NOT NULL
);


ALTER TABLE "public"."session" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."twoFactor" (
    "id" "text" NOT NULL,
    "secret" "text" NOT NULL,
    "backupCodes" "text" NOT NULL,
    "userId" "text" NOT NULL
);


ALTER TABLE "public"."twoFactor" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."verification" (
    "id" "text" NOT NULL,
    "identifier" "text" NOT NULL,
    "value" "text" NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."verification" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."view_all_event_access" AS
 WITH "raw_access" AS (
         SELECT "e"."id" AS "event_id",
            "e"."created_by" AS "user_id",
            3 AS "role"
           FROM "public"."event" "e"
        UNION ALL
         SELECT "e"."id" AS "event_id",
            "ega"."user_id",
            "ega"."role"
           FROM ("public"."event" "e"
             JOIN "public"."event_group_access" "ega" ON (("e"."event_group_id" = "ega"."event_group_id")))
          WHERE ("ega"."user_id" IS NOT NULL)
        UNION ALL
         SELECT "e"."id" AS "event_id",
            "ugm"."user_id",
            "ega"."role"
           FROM (("public"."event" "e"
             JOIN "public"."event_group_access" "ega" ON (("e"."event_group_id" = "ega"."event_group_id")))
             JOIN "public"."user_group_member" "ugm" ON (("ega"."user_group_id" = "ugm"."user_group_id")))
        UNION ALL
         SELECT "ea"."event_id",
            "ea"."user_id",
            "ea"."role"
           FROM "public"."event_access" "ea"
          WHERE ("ea"."user_id" IS NOT NULL)
        UNION ALL
         SELECT "ea"."event_id",
            "ugm"."user_id",
            "ea"."role"
           FROM ("public"."event_access" "ea"
             JOIN "public"."user_group_member" "ugm" ON (("ea"."user_group_id" = "ugm"."user_group_id")))
        )
 SELECT "event_id",
    "user_id",
    "max"("role") AS "role"
   FROM "raw_access"
  GROUP BY "event_id", "user_id";


ALTER VIEW "public"."view_all_event_access" OWNER TO "postgres";


ALTER TABLE ONLY "public"."account"
    ADD CONSTRAINT "account_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_summaries"
    ADD CONSTRAINT "chat_summaries_conversation_user_unique" UNIQUE ("conversation_id", "user_id");



ALTER TABLE ONLY "public"."chat_summaries"
    ADD CONSTRAINT "chat_summaries_meeting_user_unique" UNIQUE ("meeting_id", "user_id");



ALTER TABLE ONLY "public"."chat_summaries"
    ADD CONSTRAINT "chat_summaries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_participant"
    ADD CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_participant"
    ADD CONSTRAINT "conversation_participants_unique" UNIQUE ("conversation_id", "user_id");



ALTER TABLE ONLY "public"."conversation"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_access"
    ADD CONSTRAINT "event_access_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_group_access"
    ADD CONSTRAINT "event_group_access_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_group"
    ADD CONSTRAINT "event_group_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event"
    ADD CONSTRAINT "event_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_user_state"
    ADD CONSTRAINT "event_user_state_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meeting_event"
    ADD CONSTRAINT "meeting_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meeting_participant"
    ADD CONSTRAINT "meeting_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meeting_transcript_segment"
    ADD CONSTRAINT "meeting_transcript_segment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meeting"
    ADD CONSTRAINT "meetings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."message"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."passcode_attempt"
    ADD CONSTRAINT "passcode_attempt_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."passkey"
    ADD CONSTRAINT "passkey_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session"
    ADD CONSTRAINT "session_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session"
    ADD CONSTRAINT "session_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."twoFactor"
    ADD CONSTRAINT "twoFactor_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user"
    ADD CONSTRAINT "user_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."user_group_member"
    ADD CONSTRAINT "user_group_member_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_group"
    ADD CONSTRAINT "user_group_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user"
    ADD CONSTRAINT "user_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."verification"
    ADD CONSTRAINT "verification_pkey" PRIMARY KEY ("id");



CREATE INDEX "account_userId_idx" ON "public"."account" USING "btree" ("userId");



CREATE INDEX "chat_summaries_conversation_id_idx" ON "public"."chat_summaries" USING "btree" ("conversation_id");



CREATE INDEX "chat_summaries_last_message_id_idx" ON "public"."chat_summaries" USING "btree" ("last_message_id");



CREATE INDEX "chat_summaries_meeting_id_idx" ON "public"."chat_summaries" USING "btree" ("meeting_id");



CREATE INDEX "chat_summaries_updated_at_idx" ON "public"."chat_summaries" USING "btree" ("updated_at" DESC);



CREATE INDEX "chat_summaries_user_id_idx" ON "public"."chat_summaries" USING "btree" ("user_id");



CREATE INDEX "conversation_event_group_id_idx" ON "public"."conversation" USING "btree" ("event_group_id");



CREATE INDEX "conversation_participants_conversation_id_idx" ON "public"."conversation_participant" USING "btree" ("conversation_id");



CREATE INDEX "conversation_participants_last_read_message_id_idx" ON "public"."conversation_participant" USING "btree" ("last_read_message_id");



CREATE INDEX "conversation_participants_last_seen_idx" ON "public"."conversation_participant" USING "btree" ("user_id", "last_seen_at");



CREATE INDEX "conversation_participants_user_id_idx" ON "public"."conversation_participant" USING "btree" ("user_id");



CREATE INDEX "conversations_event_id_idx" ON "public"."conversation" USING "btree" ("event_id");



CREATE INDEX "conversations_last_message_at_idx" ON "public"."conversation" USING "btree" ("last_message_at" DESC NULLS LAST);



CREATE INDEX "conversations_type_idx" ON "public"."conversation" USING "btree" ("type");



CREATE INDEX "conversations_user_group_id_idx" ON "public"."conversation" USING "btree" ("user_group_id");



CREATE INDEX "event_access_event_id_idx" ON "public"."event_access" USING "btree" ("event_id");



CREATE INDEX "event_access_user_group_id_idx" ON "public"."event_access" USING "btree" ("user_group_id");



CREATE INDEX "event_access_user_id_idx" ON "public"."event_access" USING "btree" ("user_id");



CREATE INDEX "event_created_by_idx" ON "public"."event" USING "btree" ("created_by");



CREATE INDEX "event_event_group_id_idx" ON "public"."event" USING "btree" ("event_group_id");



CREATE INDEX "event_group_access_event_group_id_idx" ON "public"."event_group_access" USING "btree" ("event_group_id");



CREATE INDEX "event_group_access_user_group_id_idx" ON "public"."event_group_access" USING "btree" ("user_group_id");



CREATE INDEX "event_group_access_user_id_idx" ON "public"."event_group_access" USING "btree" ("user_id");



CREATE INDEX "event_group_created_by_idx" ON "public"."event_group" USING "btree" ("created_by");



CREATE INDEX "event_user_state_event_id_idx" ON "public"."event_user_state" USING "btree" ("event_id");



CREATE INDEX "event_user_state_user_id_idx" ON "public"."event_user_state" USING "btree" ("user_id");



CREATE INDEX "idx_meeting_participant_joined_via_passcode" ON "public"."meeting_participant" USING "btree" ("meeting_id", "joined_via_passcode") WHERE ("joined_via_passcode" = true);



CREATE INDEX "idx_passcode_attempt_attempted_at" ON "public"."passcode_attempt" USING "btree" ("attempted_at");



CREATE INDEX "idx_passcode_attempt_meeting_id" ON "public"."passcode_attempt" USING "btree" ("meeting_id");



CREATE INDEX "meeting_events_created_at_idx" ON "public"."meeting_event" USING "btree" ("created_at");



CREATE INDEX "meeting_events_event_type_idx" ON "public"."meeting_event" USING "btree" ("event_type");



CREATE INDEX "meeting_events_meeting_id_idx" ON "public"."meeting_event" USING "btree" ("meeting_id");



CREATE INDEX "meeting_events_user_id_idx" ON "public"."meeting_event" USING "btree" ("user_id");



CREATE INDEX "meeting_participants_meeting_id_idx" ON "public"."meeting_participant" USING "btree" ("meeting_id");



CREATE UNIQUE INDEX "meeting_participants_unique_session" ON "public"."meeting_participant" USING "btree" ("meeting_id", "user_id", "joined_at");



CREATE INDEX "meeting_participants_user_id_idx" ON "public"."meeting_participant" USING "btree" ("user_id");



CREATE UNIQUE INDEX "meeting_passcode_key" ON "public"."meeting" USING "btree" ("passcode") WHERE ("passcode" IS NOT NULL);



CREATE INDEX "meeting_transcript_segment_meeting_id_idx" ON "public"."meeting_transcript_segment" USING "btree" ("meeting_id");



CREATE INDEX "meeting_transcript_segment_spoken_at_idx" ON "public"."meeting_transcript_segment" USING "btree" ("spoken_at");



CREATE INDEX "meetings_creator_id_idx" ON "public"."meeting" USING "btree" ("creator_id");



CREATE INDEX "meetings_started_at_idx" ON "public"."meeting" USING "btree" ("started_at");



CREATE UNIQUE INDEX "meetings_video_sdk_meeting_id_key" ON "public"."meeting" USING "btree" ("room_id");



CREATE INDEX "messages_conversation_created_idx" ON "public"."message" USING "btree" ("conversation_id", "created_at" DESC);



CREATE INDEX "messages_conversation_id_idx" ON "public"."message" USING "btree" ("conversation_id");



CREATE INDEX "messages_created_at_idx" ON "public"."message" USING "btree" ("created_at" DESC);



CREATE INDEX "messages_meeting_id_idx" ON "public"."message" USING "btree" ("meeting_id");



CREATE INDEX "messages_reply_to_id_idx" ON "public"."message" USING "btree" ("reply_to_id");



CREATE INDEX "messages_sender_id_idx" ON "public"."message" USING "btree" ("sender_id");



CREATE INDEX "notifications_created_at_idx" ON "public"."notification" USING "btree" ("created_at");



CREATE INDEX "notifications_user_id_idx" ON "public"."notification" USING "btree" ("user_id");



CREATE INDEX "passkey_credentialID_idx" ON "public"."passkey" USING "btree" ("credentialID");



CREATE INDEX "passkey_userId_idx" ON "public"."passkey" USING "btree" ("userId");



CREATE INDEX "session_userId_idx" ON "public"."session" USING "btree" ("userId");



CREATE INDEX "twoFactor_secret_idx" ON "public"."twoFactor" USING "btree" ("secret");



CREATE INDEX "twoFactor_userId_idx" ON "public"."twoFactor" USING "btree" ("userId");



CREATE INDEX "user_group_created_by_idx" ON "public"."user_group" USING "btree" ("created_by");



CREATE INDEX "user_group_member_user_group_id_idx" ON "public"."user_group_member" USING "btree" ("user_group_id");



CREATE INDEX "user_group_member_user_id_idx" ON "public"."user_group_member" USING "btree" ("user_id");



CREATE INDEX "verification_identifier_idx" ON "public"."verification" USING "btree" ("identifier");



CREATE OR REPLACE TRIGGER "update_conversation_last_message_trigger" AFTER INSERT ON "public"."message" FOR EACH ROW EXECUTE FUNCTION "public"."update_conversation_last_message"();



ALTER TABLE ONLY "public"."account"
    ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_summaries"
    ADD CONSTRAINT "chat_summaries_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_summaries"
    ADD CONSTRAINT "chat_summaries_last_message_id_fkey" FOREIGN KEY ("last_message_id") REFERENCES "public"."message"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_summaries"
    ADD CONSTRAINT "chat_summaries_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."meeting"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_summaries"
    ADD CONSTRAINT "chat_summaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation"
    ADD CONSTRAINT "conversation_event_group_id_fkey" FOREIGN KEY ("event_group_id") REFERENCES "public"."event_group"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_participant"
    ADD CONSTRAINT "conversation_participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_participant"
    ADD CONSTRAINT "conversation_participants_last_read_message_id_fkey" FOREIGN KEY ("last_read_message_id") REFERENCES "public"."message"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."conversation_participant"
    ADD CONSTRAINT "conversation_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation"
    ADD CONSTRAINT "conversations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation"
    ADD CONSTRAINT "conversations_user_group_id_fkey" FOREIGN KEY ("user_group_id") REFERENCES "public"."user_group"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_access"
    ADD CONSTRAINT "event_access_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_access"
    ADD CONSTRAINT "event_access_user_group_id_fkey" FOREIGN KEY ("user_group_id") REFERENCES "public"."user_group"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_access"
    ADD CONSTRAINT "event_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event"
    ADD CONSTRAINT "event_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event"
    ADD CONSTRAINT "event_event_group_id_fkey" FOREIGN KEY ("event_group_id") REFERENCES "public"."event_group"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_group_access"
    ADD CONSTRAINT "event_group_access_user_group_id_fkey" FOREIGN KEY ("user_group_id") REFERENCES "public"."user_group"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_group_access"
    ADD CONSTRAINT "event_group_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_group"
    ADD CONSTRAINT "event_group_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_group_access"
    ADD CONSTRAINT "event_group_map_event_group_id_fkey" FOREIGN KEY ("event_group_id") REFERENCES "public"."event_group"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event"
    ADD CONSTRAINT "event_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."meeting"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_user_state"
    ADD CONSTRAINT "event_user_state_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_user_state"
    ADD CONSTRAINT "event_user_state_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meeting_event"
    ADD CONSTRAINT "meeting_events_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."meeting"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meeting_event"
    ADD CONSTRAINT "meeting_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meeting_participant"
    ADD CONSTRAINT "meeting_participants_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."meeting"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meeting_participant"
    ADD CONSTRAINT "meeting_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meeting_transcript_segment"
    ADD CONSTRAINT "meeting_transcript_segment_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."meeting"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meeting"
    ADD CONSTRAINT "meetings_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message"
    ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message"
    ADD CONSTRAINT "messages_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."meeting"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."message"
    ADD CONSTRAINT "messages_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "public"."message"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."message"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."user"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."passcode_attempt"
    ADD CONSTRAINT "passcode_attempt_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."meeting"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."passkey"
    ADD CONSTRAINT "passkey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session"
    ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."twoFactor"
    ADD CONSTRAINT "twoFactor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_group"
    ADD CONSTRAINT "user_group_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_group_member"
    ADD CONSTRAINT "user_group_member_user_group_id_fkey" FOREIGN KEY ("user_group_id") REFERENCES "public"."user_group"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_group_member"
    ADD CONSTRAINT "user_group_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE "public"."account" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authenticated_delete_own_chat_summaries" ON "public"."chat_summaries" FOR DELETE TO "authenticated" USING (((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text") AND ("user_id" = "public"."current_user_id"())));



CREATE POLICY "authenticated_delete_own_messages" ON "public"."message" FOR UPDATE TO "authenticated" USING (((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text") AND ("sender_id" = "public"."current_user_id"()))) WITH CHECK (((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text") AND ("sender_id" = "public"."current_user_id"()) AND ("deleted_at" IS NOT NULL)));



CREATE POLICY "authenticated_insert_meetings" ON "public"."meeting" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text") AND ("creator_id" = "public"."current_user_id"())));



CREATE POLICY "authenticated_insert_messages" ON "public"."message" FOR INSERT TO "authenticated" WITH CHECK ((("sender_id" = "public"."current_user_id"()) AND ((("conversation_id" IS NOT NULL) AND "public"."check_conversation_access"("public"."current_user_id"(), "conversation_id")) OR (("meeting_id" IS NOT NULL) AND "public"."can_access_meeting"("meeting_id", "public"."current_user_id"())))));



CREATE POLICY "authenticated_insert_own_chat_summaries" ON "public"."chat_summaries" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text") AND ("user_id" = "public"."current_user_id"())));



CREATE POLICY "authenticated_read_conversations" ON "public"."conversation" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text") AND "public"."check_conversation_access"("public"."current_user_id"(), "id")));



CREATE POLICY "authenticated_read_meeting_participants" ON "public"."meeting_participant" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text") AND "public"."can_access_meeting"("meeting_id", "public"."current_user_id"())));



CREATE POLICY "authenticated_read_meeting_transcript_segment" ON "public"."meeting_transcript_segment" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text") AND "public"."can_access_meeting"("meeting_id", "public"."current_user_id"())));



CREATE POLICY "authenticated_read_meetings" ON "public"."meeting" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text") AND "public"."can_access_meeting"("id", "public"."current_user_id"())));



CREATE POLICY "authenticated_read_messages" ON "public"."message" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text") AND ((("conversation_id" IS NOT NULL) AND "public"."check_conversation_access"("public"."current_user_id"(), "conversation_id")) OR (("meeting_id" IS NOT NULL) AND "public"."can_access_meeting"("meeting_id", "public"."current_user_id"())))));



CREATE POLICY "authenticated_read_own_chat_summaries" ON "public"."chat_summaries" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text") AND ("user_id" = "public"."current_user_id"())));



CREATE POLICY "authenticated_read_own_notifications" ON "public"."notification" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text") AND ("user_id" = "public"."current_user_id"())));



COMMENT ON POLICY "authenticated_read_own_notifications" ON "public"."notification" IS 'Users can read their own notifications';



CREATE POLICY "authenticated_read_participants" ON "public"."conversation_participant" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text") AND "public"."check_conversation_access"("public"."current_user_id"(), "conversation_id")));



CREATE POLICY "authenticated_read_users" ON "public"."user" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text"));



COMMENT ON POLICY "authenticated_read_users" ON "public"."user" IS 'All authenticated users can read user profiles for mentions, search, etc.';



CREATE POLICY "authenticated_select_messages" ON "public"."message" FOR SELECT TO "authenticated" USING (((("conversation_id" IS NOT NULL) AND "public"."check_conversation_access"("public"."current_user_id"(), "conversation_id")) OR (("meeting_id" IS NOT NULL) AND "public"."can_access_meeting"("meeting_id", "public"."current_user_id"()))));



CREATE POLICY "authenticated_update_conversations" ON "public"."conversation" FOR UPDATE TO "authenticated" USING (((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text") AND "public"."check_conversation_access"("public"."current_user_id"(), "id"))) WITH CHECK (((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text") AND "public"."check_conversation_access"("public"."current_user_id"(), "id")));



CREATE POLICY "authenticated_update_messages" ON "public"."message" FOR UPDATE TO "authenticated" USING ((("sender_id" = "public"."current_user_id"()) AND ((("conversation_id" IS NOT NULL) AND "public"."check_conversation_access"("public"."current_user_id"(), "conversation_id")) OR (("meeting_id" IS NOT NULL) AND "public"."can_access_meeting"("meeting_id", "public"."current_user_id"())))));



CREATE POLICY "authenticated_update_own_chat_summaries" ON "public"."chat_summaries" FOR UPDATE TO "authenticated" USING (((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text") AND ("user_id" = "public"."current_user_id"()))) WITH CHECK (((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text") AND ("user_id" = "public"."current_user_id"())));



CREATE POLICY "authenticated_update_own_meetings" ON "public"."meeting" FOR UPDATE TO "authenticated" USING (((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text") AND ("creator_id" = "public"."current_user_id"()))) WITH CHECK (((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text") AND ("creator_id" = "public"."current_user_id"())));



CREATE POLICY "authenticated_update_own_messages" ON "public"."message" FOR UPDATE TO "authenticated" USING (((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text") AND ("sender_id" = "public"."current_user_id"()))) WITH CHECK (((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text") AND ("sender_id" = "public"."current_user_id"())));



COMMENT ON POLICY "authenticated_update_own_messages" ON "public"."message" IS 'Users can edit their own messages';



CREATE POLICY "authenticated_update_own_notifications" ON "public"."notification" FOR UPDATE TO "authenticated" USING (((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text") AND ("user_id" = "public"."current_user_id"()))) WITH CHECK (((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text") AND ("user_id" = "public"."current_user_id"())));



CREATE POLICY "authenticated_update_own_participant" ON "public"."conversation_participant" FOR UPDATE TO "authenticated" USING (((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text") AND ("user_id" = "public"."current_user_id"()))) WITH CHECK (((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text") AND ("user_id" = "public"."current_user_id"())));



CREATE POLICY "authenticated_update_own_participant_meeting" ON "public"."meeting_participant" FOR UPDATE TO "authenticated" USING (((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text") AND ("user_id" = "public"."current_user_id"()))) WITH CHECK (((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text") AND ("user_id" = "public"."current_user_id"())));



CREATE POLICY "authenticated_update_own_user" ON "public"."user" FOR UPDATE TO "authenticated" USING (((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text") AND ("id" = "public"."current_user_id"()))) WITH CHECK (((( SELECT "auth"."role"() AS "role") = 'authenticated'::"text") AND ("id" = "public"."current_user_id"())));



COMMENT ON POLICY "authenticated_update_own_user" ON "public"."user" IS 'Users can update their own profile';



ALTER TABLE "public"."chat_summaries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversation" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversation_participant" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_access" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_group" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_group_access" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_user_state" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."meeting" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."meeting_event" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."meeting_participant" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."meeting_transcript_segment" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."passcode_attempt" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."passkey" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "service_role_all_chat_summaries" ON "public"."chat_summaries" TO "service_role" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



CREATE POLICY "service_role_all_conversations" ON "public"."conversation" TO "service_role" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



CREATE POLICY "service_role_all_messages" ON "public"."message" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_all_participants" ON "public"."conversation_participant" TO "service_role" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



CREATE POLICY "service_role_all_transcript" ON "public"."meeting_transcript_segment" TO "service_role" USING ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text")) WITH CHECK ((( SELECT "auth"."role"() AS "role") = 'service_role'::"text"));



ALTER TABLE "public"."session" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."twoFactor" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_group" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_group_member" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."verification" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."conversation";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."event_group_access";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."message";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";































































































































































GRANT ALL ON FUNCTION "public"."can_access_meeting"("p_meeting_id" "uuid", "p_user_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_meeting"("p_meeting_id" "uuid", "p_user_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_meeting"("p_meeting_id" "uuid", "p_user_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_conversation_access"("p_user_id" "text", "p_conversation_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_conversation_access"("p_user_id" "text", "p_conversation_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_conversation_access"("p_user_id" "text", "p_conversation_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."current_user_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_id"() TO "service_role";



GRANT ALL ON TABLE "public"."event_group" TO "anon";
GRANT ALL ON TABLE "public"."event_group" TO "authenticated";
GRANT ALL ON TABLE "public"."event_group" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_accessible_event_groups"("p_user_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_accessible_event_groups"("p_user_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_accessible_event_groups"("p_user_id" "text") TO "service_role";



GRANT ALL ON TABLE "public"."user_group" TO "anon";
GRANT ALL ON TABLE "public"."user_group" TO "authenticated";
GRANT ALL ON TABLE "public"."user_group" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_accessible_user_groups"("p_user_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_accessible_user_groups"("p_user_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_accessible_user_groups"("p_user_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_active_events"("requesting_user_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_active_events"("requesting_user_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_active_events"("requesting_user_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_event"("target_event_id" "uuid", "requesting_user_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_event"("target_event_id" "uuid", "requesting_user_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_event"("target_event_id" "uuid", "requesting_user_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_event_members"("target_event_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_event_members"("target_event_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_event_members"("target_event_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_existing_direct_conversation"("user_a" "text", "user_b" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_existing_direct_conversation"("user_a" "text", "user_b" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_existing_direct_conversation"("user_a" "text", "user_b" "text") TO "service_role";



GRANT ALL ON TABLE "public"."event_user_state" TO "anon";
GRANT ALL ON TABLE "public"."event_user_state" TO "authenticated";
GRANT ALL ON TABLE "public"."event_user_state" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_event_state"("target_event_id" "uuid", "requesting_user_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_event_state"("target_event_id" "uuid", "requesting_user_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_event_state"("target_event_id" "uuid", "requesting_user_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_events"("request_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_events"("request_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_events"("request_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_conversation_last_message"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_conversation_last_message"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_conversation_last_message"() TO "service_role";


















GRANT ALL ON TABLE "public"."account" TO "anon";
GRANT ALL ON TABLE "public"."account" TO "authenticated";
GRANT ALL ON TABLE "public"."account" TO "service_role";



GRANT ALL ON TABLE "public"."chat_summaries" TO "anon";
GRANT ALL ON TABLE "public"."chat_summaries" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_summaries" TO "service_role";



GRANT ALL ON TABLE "public"."conversation" TO "anon";
GRANT ALL ON TABLE "public"."conversation" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_participant" TO "anon";
GRANT ALL ON TABLE "public"."conversation_participant" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_participant" TO "service_role";



GRANT ALL ON TABLE "public"."user" TO "anon";
GRANT ALL ON TABLE "public"."user" TO "authenticated";
GRANT ALL ON TABLE "public"."user" TO "service_role";



GRANT ALL ON TABLE "public"."direct_messages_inbox" TO "anon";
GRANT ALL ON TABLE "public"."direct_messages_inbox" TO "authenticated";
GRANT ALL ON TABLE "public"."direct_messages_inbox" TO "service_role";



GRANT ALL ON TABLE "public"."event" TO "anon";
GRANT ALL ON TABLE "public"."event" TO "authenticated";
GRANT ALL ON TABLE "public"."event" TO "service_role";



GRANT ALL ON TABLE "public"."event_access" TO "anon";
GRANT ALL ON TABLE "public"."event_access" TO "authenticated";
GRANT ALL ON TABLE "public"."event_access" TO "service_role";



GRANT ALL ON TABLE "public"."event_group_access" TO "anon";
GRANT ALL ON TABLE "public"."event_group_access" TO "authenticated";
GRANT ALL ON TABLE "public"."event_group_access" TO "service_role";



GRANT ALL ON TABLE "public"."user_group_member" TO "anon";
GRANT ALL ON TABLE "public"."user_group_member" TO "authenticated";
GRANT ALL ON TABLE "public"."user_group_member" TO "service_role";



GRANT ALL ON TABLE "public"."group_conversations_inbox" TO "anon";
GRANT ALL ON TABLE "public"."group_conversations_inbox" TO "authenticated";
GRANT ALL ON TABLE "public"."group_conversations_inbox" TO "service_role";



GRANT ALL ON TABLE "public"."meeting" TO "anon";
GRANT ALL ON TABLE "public"."meeting" TO "authenticated";
GRANT ALL ON TABLE "public"."meeting" TO "service_role";



GRANT ALL ON TABLE "public"."meeting_event" TO "anon";
GRANT ALL ON TABLE "public"."meeting_event" TO "authenticated";
GRANT ALL ON TABLE "public"."meeting_event" TO "service_role";



GRANT ALL ON TABLE "public"."meeting_participant" TO "anon";
GRANT ALL ON TABLE "public"."meeting_participant" TO "authenticated";
GRANT ALL ON TABLE "public"."meeting_participant" TO "service_role";



GRANT ALL ON TABLE "public"."meeting_transcript_segment" TO "anon";
GRANT ALL ON TABLE "public"."meeting_transcript_segment" TO "authenticated";
GRANT ALL ON TABLE "public"."meeting_transcript_segment" TO "service_role";



GRANT ALL ON TABLE "public"."message" TO "anon";
GRANT ALL ON TABLE "public"."message" TO "authenticated";
GRANT ALL ON TABLE "public"."message" TO "service_role";



GRANT ALL ON TABLE "public"."notification" TO "anon";
GRANT ALL ON TABLE "public"."notification" TO "authenticated";
GRANT ALL ON TABLE "public"."notification" TO "service_role";



GRANT ALL ON TABLE "public"."passcode_attempt" TO "anon";
GRANT ALL ON TABLE "public"."passcode_attempt" TO "authenticated";
GRANT ALL ON TABLE "public"."passcode_attempt" TO "service_role";



GRANT ALL ON TABLE "public"."passkey" TO "anon";
GRANT ALL ON TABLE "public"."passkey" TO "authenticated";
GRANT ALL ON TABLE "public"."passkey" TO "service_role";



GRANT ALL ON TABLE "public"."session" TO "anon";
GRANT ALL ON TABLE "public"."session" TO "authenticated";
GRANT ALL ON TABLE "public"."session" TO "service_role";



GRANT ALL ON TABLE "public"."twoFactor" TO "anon";
GRANT ALL ON TABLE "public"."twoFactor" TO "authenticated";
GRANT ALL ON TABLE "public"."twoFactor" TO "service_role";



GRANT ALL ON TABLE "public"."verification" TO "anon";
GRANT ALL ON TABLE "public"."verification" TO "authenticated";
GRANT ALL ON TABLE "public"."verification" TO "service_role";



GRANT ALL ON TABLE "public"."view_all_event_access" TO "anon";
GRANT ALL ON TABLE "public"."view_all_event_access" TO "authenticated";
GRANT ALL ON TABLE "public"."view_all_event_access" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































