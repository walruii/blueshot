-- Persist final meeting transcript segments for timeline display and AI summaries.

CREATE TABLE IF NOT EXISTS "public"."meeting_transcript_segment" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "meeting_id" uuid NOT NULL,
    "participant_name" text NOT NULL,
    "text" text NOT NULL,
    "spoken_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "public"."meeting_transcript_segment"
    ADD CONSTRAINT "meeting_transcript_segment_meeting_id_fkey"
    FOREIGN KEY ("meeting_id") REFERENCES "public"."meeting"("id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "meeting_transcript_segment_meeting_id_idx"
    ON "public"."meeting_transcript_segment" USING btree ("meeting_id");

CREATE INDEX IF NOT EXISTS "meeting_transcript_segment_spoken_at_idx"
    ON "public"."meeting_transcript_segment" USING btree ("spoken_at");

ALTER TABLE "public"."meeting_transcript_segment" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_transcript" ON "public"."meeting_transcript_segment";
CREATE POLICY "service_role_all_transcript" ON "public"."meeting_transcript_segment"
FOR ALL
TO service_role
USING ((SELECT auth.role()) = 'service_role')
WITH CHECK ((SELECT auth.role()) = 'service_role');

DROP POLICY IF EXISTS "authenticated_read_meeting_transcript_segment" ON "public"."meeting_transcript_segment";
CREATE POLICY "authenticated_read_meeting_transcript_segment" ON "public"."meeting_transcript_segment"
FOR SELECT
TO authenticated
USING (
  (SELECT auth.role()) = 'authenticated'
  AND public.can_access_meeting(meeting_id, public.current_user_id())
);
