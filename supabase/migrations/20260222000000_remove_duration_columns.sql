-- Remove duration_seconds columns from meetings and meeting_participants tables
-- Duration can be calculated on-demand from timestamps if needed

-- Drop duration_seconds from meetings table
ALTER TABLE "public"."meetings"
DROP COLUMN IF EXISTS "duration_seconds";

-- Drop duration_seconds from meeting_participants table
ALTER TABLE "public"."meeting_participants"
DROP COLUMN IF EXISTS "duration_seconds";
