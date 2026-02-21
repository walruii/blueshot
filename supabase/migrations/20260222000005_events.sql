-- Events and access control

CREATE TABLE "public"."event" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "from" timestamp with time zone NOT NULL,
    "to" timestamp with time zone,
    "created_by" "text" NOT NULL,
    "type" "public"."event_type" NOT NULL,
    "status" "public"."event_status" NOT NULL,
    "event_group_id" "uuid" NOT NULL
);

CREATE TABLE "public"."event_access" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "text" NOT NULL,
    "event_id" "uuid" NOT NULL,
    "role" integer NOT NULL,
    "user_group_id" "uuid"
);

CREATE TABLE "public"."event_user_state" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "event_sent_at" timestamp with time zone,
    "acknowledged_at" timestamp with time zone
);

CREATE INDEX "event_created_by_idx" ON "public"."event" USING "btree" ("created_by");
CREATE INDEX "event_event_group_id_idx" ON "public"."event" USING "btree" ("event_group_id");
CREATE INDEX "event_access_event_id_idx" ON "public"."event_access" USING "btree" ("event_id");
CREATE INDEX "event_access_user_id_idx" ON "public"."event_access" USING "btree" ("user_id");
CREATE INDEX "event_access_user_group_id_idx" ON "public"."event_access" USING "btree" ("user_group_id");
CREATE INDEX "event_user_state_event_id_idx" ON "public"."event_user_state" USING "btree" ("event_id");
CREATE INDEX "event_user_state_user_id_idx" ON "public"."event_user_state" USING "btree" ("user_id");

ALTER TABLE "public"."event"
    ADD CONSTRAINT "event_created_by_fkey"
    FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."event"
    ADD CONSTRAINT "event_event_group_id_fkey"
    FOREIGN KEY ("event_group_id") REFERENCES "public"."event_group"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."event_access"
    ADD CONSTRAINT "event_access_event_id_fkey"
    FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."event_access"
    ADD CONSTRAINT "event_access_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."event_access"
    ADD CONSTRAINT "event_access_user_group_id_fkey"
    FOREIGN KEY ("user_group_id") REFERENCES "public"."user_group"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."event_user_state"
    ADD CONSTRAINT "event_user_state_event_id_fkey"
    FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."event_user_state"
    ADD CONSTRAINT "event_user_state_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;

CREATE OR REPLACE VIEW "public"."view_all_event_access" WITH ("security_invoker"='on') AS
 SELECT "e"."id" AS "event_id",
    "ega"."user_id"
   FROM ("public"."event" "e"
     JOIN "public"."event_group_access" "ega" ON (("e"."event_group_id" = "ega"."event_group_id")))
  WHERE ("ega"."user_id" IS NOT NULL)
UNION
 SELECT "e"."id" AS "event_id",
    "ugm"."user_id"
   FROM (("public"."event" "e"
     JOIN "public"."event_group_access" "ega" ON (("e"."event_group_id" = "ega"."event_group_id")))
     JOIN "public"."user_group_member" "ugm" ON (("ega"."user_group_id" = "ugm"."user_group_id")))
  WHERE ("ega"."user_group_id" IS NOT NULL)
UNION
 SELECT "ea"."event_id",
    "ea"."user_id"
   FROM "public"."event_access" "ea"
  WHERE ("ea"."user_id" IS NOT NULL)
UNION
 SELECT "ea"."event_id",
    "ugm"."user_id"
   FROM ("public"."event_access" "ea"
     JOIN "public"."user_group_member" "ugm" ON (("ea"."user_group_id" = "ugm"."user_group_id")))
  WHERE ("ea"."user_group_id" IS NOT NULL);

CREATE OR REPLACE FUNCTION "public"."get_active_events"("requesting_user_id" "text")
RETURNS TABLE(
    "id" "uuid",
    "title" "text",
    "description" "text",
    "from" timestamp with time zone,
    "to" timestamp with time zone,
    "created_by" "text",
    "created_at" timestamp with time zone,
    "type" "public"."event_type",
    "status" "public"."event_status",
    "event_group_id" "uuid",
    "event_user_name" "text",
    "event_user_email" "text"
)
LANGUAGE "plpgsql"
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT e.id, e.title, e.description, e."from", e."to", e.created_by, e.created_at, e.type, e.status, e.event_group_id, u.name as event_user_name, u.email as event_user_email
    FROM event e
    LEFT JOIN "user" u ON e.created_by = u.id
    WHERE e."to" > NOW()
    AND EXISTS (
        SELECT 1
        FROM view_all_event_access vae
        WHERE vae.event_id = e.id
        AND vae.user_id = requesting_user_id
    )
    ORDER BY e."from";
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_event"("request_id" "uuid")
RETURNS TABLE(
    "id" "uuid",
    "title" "text",
    "description" "text",
    "from" timestamp with time zone,
    "to" timestamp with time zone,
    "created_by" "text",
    "created_at" timestamp with time zone,
    "type" "public"."event_type",
    "status" "public"."event_status",
    "event_group_id" "uuid",
    "event_user_name" "text",
    "event_user_email" "text"
)
LANGUAGE "plpgsql"
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT e.id, e.title, e.description, e."from", e."to", e.created_by, e.created_at, e.type, e.status, e.event_group_id, u.name as event_user_name, u.email as event_user_email
    FROM event e
    LEFT JOIN "user" u ON e.created_by = u.id
    WHERE e.id = request_id
    LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_event_members"("target_event_id" "uuid")
RETURNS TABLE(
    "acknowledged_at" timestamp with time zone,
    "created_at" timestamp with time zone,
    "event_id" "uuid",
    "event_sent_at" timestamp with time zone,
    "id" "uuid",
    "user_id" "text",
    "user_name" "text",
    "user_email" "text"
)
LANGUAGE "plpgsql"
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

CREATE OR REPLACE FUNCTION "public"."get_user_event_state"(
    "target_event_id" "uuid",
    "requesting_user_id" "text"
)
RETURNS SETOF "public"."event_user_state"
LANGUAGE "plpgsql"
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

CREATE OR REPLACE FUNCTION "public"."get_user_events"("request_id" "text")
RETURNS TABLE(
    "id" "uuid",
    "title" "text",
    "description" "text",
    "from" timestamp with time zone,
    "to" timestamp with time zone,
    "created_by" "text",
    "created_at" timestamp with time zone,
    "type" "public"."event_type",
    "status" "public"."event_status",
    "event_group_id" "uuid",
    "event_user_name" "text",
    "event_user_email" "text"
)
LANGUAGE "plpgsql"
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT e.id, e.title, e.description, e."from", e."to", e.created_by, e.created_at, e.type, e.status, e.event_group_id, u.name as event_user_name, u.email as event_user_email
    FROM event e
    LEFT JOIN "user" u ON e.created_by = u.id
    LEFT JOIN event_group_access ega ON e.event_group_id = ega.event_group_id
    LEFT JOIN user_group_member ugm ON ega.user_group_id = ugm.user_group_id
    LEFT JOIN event_access ea ON e.id = ea.event_id
    LEFT JOIN user_group_member ugm_direct ON ea.user_group_id = ugm_direct.user_group_id
    WHERE
        e.created_by = request_id
        OR ega.user_id = request_id
        OR ugm.user_id = request_id
        OR ea.user_id = request_id
        OR ugm_direct.user_id = request_id;
END;
$$;

ALTER FUNCTION "public"."get_active_events"("text") SET search_path = "public";
ALTER FUNCTION "public"."get_event"("uuid") SET search_path = "public";
ALTER FUNCTION "public"."get_event_members"("uuid") SET search_path = "public";
ALTER FUNCTION "public"."get_user_event_state"("uuid", "text") SET search_path = "public";
ALTER FUNCTION "public"."get_user_events"("text") SET search_path = "public";

ALTER TABLE "public"."event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."event_access" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."event_user_state" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON "public"."event"
FOR ALL
TO service_role
USING ((select auth.role()) = 'service_role')
WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "service_role_all" ON "public"."event_access"
FOR ALL
TO service_role
USING ((select auth.role()) = 'service_role')
WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "service_role_all" ON "public"."event_user_state"
FOR ALL
TO service_role
USING ((select auth.role()) = 'service_role')
WITH CHECK ((select auth.role()) = 'service_role');
