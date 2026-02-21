-- Create meetings table to track video meetings
CREATE TABLE IF NOT EXISTS "public"."meetings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "video_sdk_meeting_id" "text" NOT NULL,
    "creator_id" "text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ended_at" timestamp with time zone,
    "duration_seconds" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."meetings" OWNER TO "postgres";

CREATE UNIQUE INDEX "meetings_video_sdk_meeting_id_key" ON "public"."meetings" USING "btree" ("video_sdk_meeting_id");
CREATE INDEX "meetings_creator_id_idx" ON "public"."meetings" USING "btree" ("creator_id");
CREATE INDEX "meetings_started_at_idx" ON "public"."meetings" USING "btree" ("started_at");

-- Create meeting_participants table to track attendance
CREATE TABLE IF NOT EXISTS "public"."meeting_participants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "meeting_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "left_at" timestamp with time zone,
    "is_moderator" boolean DEFAULT false NOT NULL,
    "mic_enabled_at_join" boolean DEFAULT false NOT NULL,
    "camera_enabled_at_join" boolean DEFAULT false NOT NULL,
    "duration_seconds" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."meeting_participants" OWNER TO "postgres";

CREATE INDEX "meeting_participants_meeting_id_idx" ON "public"."meeting_participants" USING "btree" ("meeting_id");
CREATE INDEX "meeting_participants_user_id_idx" ON "public"."meeting_participants" USING "btree" ("user_id");
CREATE UNIQUE INDEX "meeting_participants_unique_session" ON "public"."meeting_participants" USING "btree" ("meeting_id", "user_id", "joined_at");

-- Create meeting_events table to track participant actions
CREATE TABLE IF NOT EXISTS "public"."meeting_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "meeting_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "event_type" "text" NOT NULL CHECK ("event_type" IN ('join', 'leave', 'hand_raise', 'hand_lower', 'mic_on', 'mic_off', 'camera_on', 'camera_off')),
    "event_data" jsonb,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."meeting_events" OWNER TO "postgres";

CREATE INDEX "meeting_events_meeting_id_idx" ON "public"."meeting_events" USING "btree" ("meeting_id");
CREATE INDEX "meeting_events_user_id_idx" ON "public"."meeting_events" USING "btree" ("user_id");
CREATE INDEX "meeting_events_event_type_idx" ON "public"."meeting_events" USING "btree" ("event_type");
CREATE INDEX "meeting_events_created_at_idx" ON "public"."meeting_events" USING "btree" ("created_at");

-- Add foreign key constraints
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

-- Enable RLS on new tables
ALTER TABLE "public"."meetings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."meeting_participants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."meeting_events" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meetings table
CREATE POLICY "Users can view meetings they created"
ON "public"."meetings"
FOR SELECT
USING ("creator_id" = auth.uid()::text);

CREATE POLICY "Users can view meetings they participated in"
ON "public"."meetings"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "public"."meeting_participants"
    WHERE "meeting_participants"."meeting_id" = "meetings"."id"
    AND "meeting_participants"."user_id" = auth.uid()::text
  )
);

CREATE POLICY "Users can create meetings"
ON "public"."meetings"
FOR INSERT
WITH CHECK ("creator_id" = auth.uid()::text);

-- RLS Policies for meeting_participants table
CREATE POLICY "Users can view participants in meetings they joined"
ON "public"."meeting_participants"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "public"."meetings"
    WHERE "meetings"."id" = "meeting_participants"."meeting_id"
    AND ("meetings"."creator_id" = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM "public"."meeting_participants" mp
        WHERE mp."meeting_id" = "meeting_participants"."meeting_id"
        AND mp."user_id" = auth.uid()::text
      )
    )
  )
);

CREATE POLICY "Service role can insert participant records"
ON "public"."meeting_participants"
FOR INSERT
WITH CHECK (true);

-- RLS Policies for meeting_events table
CREATE POLICY "Users can view events in meetings they joined"
ON "public"."meeting_events"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "public"."meetings"
    WHERE "meetings"."id" = "meeting_events"."meeting_id"
    AND ("meetings"."creator_id" = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM "public"."meeting_participants" mp
        WHERE mp."meeting_id" = "meeting_events"."meeting_id"
        AND mp."user_id" = auth.uid()::text
      )
    )
  )
);

CREATE POLICY "Service role can insert event records"
ON "public"."meeting_events"
FOR INSERT
WITH CHECK (true);
