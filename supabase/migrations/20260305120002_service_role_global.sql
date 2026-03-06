-- Service Role Global Policies
-- Ensures service_role (backend operations) can access and modify ALL tables
-- This is critical for server actions using supabaseAdmin client

-- ============================================================================
-- AUTH TABLES - Service role policies (most already exist, ensuring completeness)
-- ============================================================================

-- These tables already have service_role policies from initial migrations
-- Including here for completeness and to ensure they're not accidentally removed

-- User table (already has service_role_all)
-- Account, passkey, session, twoFactor, verification (already have service_role policies)

-- ============================================================================
-- USER & GROUP TABLES
-- ============================================================================

-- user_group (already has service_role_all)
-- user_group_member (already has service_role_all)
-- event_group (already has service_role_all)
-- event_group_access (already has service_role_all)

-- ============================================================================
-- EVENT TABLES
-- ============================================================================

-- event (already has service_role_all)
-- event_access (already has service_role_all)
-- event_user_state (already has service_role_all)

-- ============================================================================
-- NOTIFICATION TABLE
-- ============================================================================

-- notification (already has service_role_all)

-- ============================================================================
-- MEETING TABLES
-- ============================================================================

-- meeting (already has service_role_all)
-- meeting_participant (already has service_role_all)
-- meeting_event (already has service_role_all)
-- meeting_transcript_segment (already has service_role_all_transcript)

-- ============================================================================
-- VERIFY ALL TABLES WITH RLS HAVE SERVICE ROLE ACCESS
-- ============================================================================

-- This migration primarily serves as documentation that all tables
-- are already protected by service_role policies from their initial migrations.

-- If any new tables are added in the future, they should follow this pattern:
--
-- CREATE POLICY "service_role_all_<table_name>" ON "public"."<table_name>"
-- FOR ALL
-- TO service_role
-- USING ((SELECT auth.role()) = 'service_role')
-- WITH CHECK ((SELECT auth.role()) = 'service_role');

-- ============================================================================
-- ADD SERVICE ROLE AUTHENTICATED USER POLICIES
-- ============================================================================

-- Some tables need authenticated user read access in addition to service role
-- These are added below for tables that need it:

-- User table: Authenticated users can read all users (for mentions, user search, etc.)
DROP POLICY IF EXISTS "authenticated_read_users" ON "public"."user";
CREATE POLICY "authenticated_read_users" ON "public"."user"
FOR SELECT
TO authenticated
USING ((SELECT auth.role()) = 'authenticated');

-- User table: Authenticated users can update their own profile
DROP POLICY IF EXISTS "authenticated_update_own_user" ON "public"."user";
CREATE POLICY "authenticated_update_own_user" ON "public"."user"
FOR UPDATE
TO authenticated
USING (
  (SELECT auth.role()) = 'authenticated'
  AND id = public.current_user_id()
)
WITH CHECK (
  (SELECT auth.role()) = 'authenticated'
  AND id = public.current_user_id()
);

-- ============================================================================
-- NOTIFICATION POLICIES FOR AUTHENTICATED USERS
-- ============================================================================

-- Users can read their own notifications
DROP POLICY IF EXISTS "authenticated_read_own_notifications" ON "public"."notification";
CREATE POLICY "authenticated_read_own_notifications" ON "public"."notification"
FOR SELECT
TO authenticated
USING (
  (SELECT auth.role()) = 'authenticated'
  AND user_id = public.current_user_id()
);

-- Users can update their own notifications (mark as read)
DROP POLICY IF EXISTS "authenticated_update_own_notifications" ON "public"."notification";
CREATE POLICY "authenticated_update_own_notifications" ON "public"."notification"
FOR UPDATE
TO authenticated
USING (
  (SELECT auth.role()) = 'authenticated'
  AND user_id = public.current_user_id()
)
WITH CHECK (
  (SELECT auth.role()) = 'authenticated'
  AND user_id = public.current_user_id()
);

-- ============================================================================
-- MEETING POLICIES FOR AUTHENTICATED USERS
-- ============================================================================

-- Users can read meetings they're participating in or created
DROP POLICY IF EXISTS "authenticated_read_meetings" ON "public"."meeting";
CREATE POLICY "authenticated_read_meetings" ON "public"."meeting"
FOR SELECT
TO authenticated
USING (
  (SELECT auth.role()) = 'authenticated'
  AND public.can_access_meeting(id, public.current_user_id())
);

-- Users can create meetings
DROP POLICY IF EXISTS "authenticated_insert_meetings" ON "public"."meeting";
CREATE POLICY "authenticated_insert_meetings" ON "public"."meeting"
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.role()) = 'authenticated'
  AND creator_id = public.current_user_id()
);

-- Users can update meetings they created
DROP POLICY IF EXISTS "authenticated_update_own_meetings" ON "public"."meeting";
CREATE POLICY "authenticated_update_own_meetings" ON "public"."meeting"
FOR UPDATE
TO authenticated
USING (
  (SELECT auth.role()) = 'authenticated'
  AND creator_id = public.current_user_id()
)
WITH CHECK (
  (SELECT auth.role()) = 'authenticated'
  AND creator_id = public.current_user_id()
);

-- ============================================================================
-- MEETING PARTICIPANT POLICIES
-- ============================================================================

-- Users can read participants of meetings they're in or created
DROP POLICY IF EXISTS "authenticated_read_meeting_participants" ON "public"."meeting_participant";
CREATE POLICY "authenticated_read_meeting_participants" ON "public"."meeting_participant"
FOR SELECT
TO authenticated
USING (
  (SELECT auth.role()) = 'authenticated'
  AND public.can_access_meeting(meeting_id, public.current_user_id())
);

-- Users can update their own participant record
DROP POLICY IF EXISTS "authenticated_update_own_participant_meeting" ON "public"."meeting_participant";
CREATE POLICY "authenticated_update_own_participant_meeting" ON "public"."meeting_participant"
FOR UPDATE
TO authenticated
USING (
  (SELECT auth.role()) = 'authenticated'
  AND user_id = public.current_user_id()
)
WITH CHECK (
  (SELECT auth.role()) = 'authenticated'
  AND user_id = public.current_user_id()
);

COMMENT ON POLICY "authenticated_read_users" ON "public"."user" IS 'All authenticated users can read user profiles for mentions, search, etc.';
COMMENT ON POLICY "authenticated_update_own_user" ON "public"."user" IS 'Users can update their own profile';
COMMENT ON POLICY "authenticated_read_own_notifications" ON "public"."notification" IS 'Users can read their own notifications';
COMMENT ON POLICY "authenticated_read_meetings" ON "public"."meeting" IS 'Users can read meetings they created or are participating in';
