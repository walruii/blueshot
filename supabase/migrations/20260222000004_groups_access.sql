-- User groups and event groups

CREATE TABLE "public"."user_group" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "created_by" "text" NOT NULL
);

CREATE TABLE "public"."user_group_member" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "text" NOT NULL,
    "user_group_id" "uuid" NOT NULL
);

CREATE TABLE "public"."event_group" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "created_by" "text" NOT NULL
);

CREATE TABLE "public"."event_group_access" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "event_group_id" "uuid" NOT NULL,
    "user_id" "text",
    "user_group_id" "uuid",
    "role" integer NOT NULL
);

CREATE INDEX "user_group_created_by_idx" ON "public"."user_group" USING "btree" ("created_by");
CREATE INDEX "user_group_member_user_id_idx" ON "public"."user_group_member" USING "btree" ("user_id");
CREATE INDEX "user_group_member_user_group_id_idx" ON "public"."user_group_member" USING "btree" ("user_group_id");
CREATE INDEX "event_group_created_by_idx" ON "public"."event_group" USING "btree" ("created_by");
CREATE INDEX "event_group_access_event_group_id_idx" ON "public"."event_group_access" USING "btree" ("event_group_id");
CREATE INDEX "event_group_access_user_id_idx" ON "public"."event_group_access" USING "btree" ("user_id");
CREATE INDEX "event_group_access_user_group_id_idx" ON "public"."event_group_access" USING "btree" ("user_group_id");

ALTER TABLE "public"."user_group"
    ADD CONSTRAINT "user_group_created_by_fkey"
    FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."user_group_member"
    ADD CONSTRAINT "user_group_member_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."user_group_member"
    ADD CONSTRAINT "user_group_member_user_group_id_fkey"
    FOREIGN KEY ("user_group_id") REFERENCES "public"."user_group"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."event_group"
    ADD CONSTRAINT "event_group_created_by_fkey"
    FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."event_group_access"
    ADD CONSTRAINT "event_group_map_event_group_id_fkey"
    FOREIGN KEY ("event_group_id") REFERENCES "public"."event_group"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."event_group_access"
    ADD CONSTRAINT "event_group_access_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."event_group_access"
    ADD CONSTRAINT "event_group_access_user_group_id_fkey"
    FOREIGN KEY ("user_group_id") REFERENCES "public"."user_group"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."user_group" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_group_member" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."event_group" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."event_group_access" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON "public"."user_group"
FOR ALL
TO service_role
USING ((select auth.role()) = 'service_role')
WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "service_role_all" ON "public"."user_group_member"
FOR ALL
TO service_role
USING ((select auth.role()) = 'service_role')
WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "service_role_all" ON "public"."event_group"
FOR ALL
TO service_role
USING ((select auth.role()) = 'service_role')
WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "service_role_all" ON "public"."event_group_access"
FOR ALL
TO service_role
USING ((select auth.role()) = 'service_role')
WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "authenticated_read" ON "public"."event_group_access"
FOR SELECT
TO authenticated
USING ((select auth.role()) = 'authenticated');

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."event_group_access";
