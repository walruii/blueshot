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

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."event_group_access";
