-- Grant access to the schema
GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO postgres;

-- Grant access to all existing tables in public
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;

-- Ensure future tables also grant access automatically
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;

-- Ensure ROW LEVEL SECURITY is enabled on all existing tables
ALTER TABLE "public"."user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."passkey" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."twoFactor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."verification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_group" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_group_member" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."event_group" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."event_group_access" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."event_access" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."event_user_state" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."meeting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."meeting_participant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."meeting_event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."conversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."conversation_participant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."passcode_attempt" ENABLE ROW LEVEL SECURITY;
