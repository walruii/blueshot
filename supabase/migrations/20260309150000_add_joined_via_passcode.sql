-- Add joined_via_passcode field to meeting_participant table
-- This tracks whether a participant joined using the meeting passcode
-- vs having direct event access

ALTER TABLE "public"."meeting_participant"
ADD COLUMN IF NOT EXISTS "joined_via_passcode" boolean DEFAULT false NOT NULL;

-- Create index for faster lookups when filtering passcode-joined participants
CREATE INDEX IF NOT EXISTS "idx_meeting_participant_joined_via_passcode"
ON "public"."meeting_participant" ("meeting_id", "joined_via_passcode")
WHERE "joined_via_passcode" = true;
