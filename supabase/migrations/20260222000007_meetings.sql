-- Meetings and participants

CREATE TABLE "public"."meetings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "video_sdk_meeting_id" "text" NOT NULL,
    "creator_id" "text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ended_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

CREATE UNIQUE INDEX "meetings_video_sdk_meeting_id_key" ON "public"."meetings" USING "btree" ("video_sdk_meeting_id");
CREATE INDEX "meetings_creator_id_idx" ON "public"."meetings" USING "btree" ("creator_id");
CREATE INDEX "meetings_started_at_idx" ON "public"."meetings" USING "btree" ("started_at");

CREATE TABLE "public"."meeting_participants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "meeting_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "left_at" timestamp with time zone,
    "is_moderator" boolean DEFAULT false NOT NULL,
    "mic_enabled_at_join" boolean DEFAULT false NOT NULL,
    "camera_enabled_at_join" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

CREATE INDEX "meeting_participants_meeting_id_idx" ON "public"."meeting_participants" USING "btree" ("meeting_id");
CREATE INDEX "meeting_participants_user_id_idx" ON "public"."meeting_participants" USING "btree" ("user_id");
CREATE UNIQUE INDEX "meeting_participants_unique_session" ON "public"."meeting_participants" USING "btree" ("meeting_id", "user_id", "joined_at");

CREATE TABLE "public"."meeting_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "meeting_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "event_type" "text" NOT NULL CHECK ("event_type" IN ('join', 'leave', 'hand_raise', 'hand_lower', 'mic_on', 'mic_off', 'camera_on', 'camera_off')),
    "event_data" jsonb,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

CREATE INDEX "meeting_events_meeting_id_idx" ON "public"."meeting_events" USING "btree" ("meeting_id");
CREATE INDEX "meeting_events_user_id_idx" ON "public"."meeting_events" USING "btree" ("user_id");
CREATE INDEX "meeting_events_event_type_idx" ON "public"."meeting_events" USING "btree" ("event_type");
CREATE INDEX "meeting_events_created_at_idx" ON "public"."meeting_events" USING "btree" ("created_at");

ALTER TABLE "public"."meetings"
    ADD CONSTRAINT "meetings_creator_id_fkey"
    FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE CASCADE;

ALTER TABLE "public"."meeting_participants"
    ADD CONSTRAINT "meeting_participants_meeting_id_fkey"
    FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE CASCADE;

ALTER TABLE "public"."meeting_participants"
    ADD CONSTRAINT "meeting_participants_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE;

ALTER TABLE "public"."meeting_events"
    ADD CONSTRAINT "meeting_events_meeting_id_fkey"
    FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE CASCADE;

ALTER TABLE "public"."meeting_events"
    ADD CONSTRAINT "meeting_events_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE;

ALTER TABLE "public"."meetings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."meeting_participants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."meeting_events" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON "public"."meetings"
FOR ALL
TO service_role
USING ((select auth.role()) = 'service_role')
WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "service_role_all" ON "public"."meeting_participants"
FOR ALL
TO service_role
USING ((select auth.role()) = 'service_role')
WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "service_role_all" ON "public"."meeting_events"
FOR ALL
TO service_role
USING ((select auth.role()) = 'service_role')
WITH CHECK ((select auth.role()) = 'service_role');
