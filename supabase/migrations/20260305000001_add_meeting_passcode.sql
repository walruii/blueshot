-- Add passcode support to meetings for external/unauthenticated access

ALTER TABLE "public"."meeting"
ADD COLUMN "passcode" text,
ADD COLUMN "passcode_created_at" timestamp with time zone DEFAULT now();

-- Create unique index on passcode (allowing NULLs for meetings created before this feature)
CREATE UNIQUE INDEX "meeting_passcode_key"
ON "public"."meeting" ("passcode")
WHERE "passcode" IS NOT NULL;

-- Update Meeting table comment
COMMENT ON COLUMN "public"."meeting"."passcode" IS 'Randomly generated 6-character alphanumeric code for external participant access';
COMMENT ON COLUMN "public"."meeting"."passcode_created_at" IS 'Timestamp when passcode was generated';
