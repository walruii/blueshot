


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."access" AS ENUM (
    'admin',
    'read',
    'read_write'
);


ALTER TYPE "public"."access" OWNER TO "supabase_admin";


CREATE TYPE "public"."event_status" AS ENUM (
    'cancel',
    'archive',
    'default'
);


ALTER TYPE "public"."event_status" OWNER TO "supabase_admin";


CREATE TYPE "public"."event_type" AS ENUM (
    'allday',
    'default'
);


ALTER TYPE "public"."event_type" OWNER TO "supabase_admin";


CREATE OR REPLACE FUNCTION "public"."get_active_events"("requesting_user_id" "text") RETURNS TABLE("id" "uuid", "title" "text", "description" "text", "from" timestamp with time zone, "to" timestamp with time zone, "created_by" "text", "created_at" timestamp with time zone, "type" "public"."event_type", "status" "public"."event_status", "event_group_id" "uuid", "event_user_name" "text", "event_user_email" "text")
    LANGUAGE "plpgsql"
    AS $$

BEGIN
    RETURN QUERY
    SELECT DISTINCT e.id, e.title, e.description, e."from", e."to", e.created_by, e.created_at, e.type, e.status, e.event_group_id, u.name as event_user_name, u.email as event_user_email
    FROM event e

    LEFT JOIN "user" u ON e.created_by = u.id
    WHERE e."to" > NOW()
    AND EXISTS (
        SELECT 1
        FROM view_all_event_access vae
        WHERE vae.event_id = e.id
        AND vae.user_id = requesting_user_id
    )
    ORDER BY e."from";

END;
$$;


ALTER FUNCTION "public"."get_active_events"("requesting_user_id" "text") OWNER TO "supabase_admin";


CREATE OR REPLACE FUNCTION "public"."get_event"("request_id" "uuid") RETURNS TABLE("id" "uuid", "title" "text", "description" "text", "from" timestamp with time zone, "to" timestamp with time zone, "created_by" "text", "created_at" timestamp with time zone, "type" "public"."event_type", "status" "public"."event_status", "event_group_id" "uuid", "event_user_name" "text", "event_user_email" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT e.id, e.title, e.description, e.from, e.to, e.created_by, e.created_at, e.type, e.status, e.event_group_id, u.name as event_user_name, u.email as event_user_email
    FROM event e

    LEFT JOIN "user" u ON e.created_by = u.id
    WHERE e.id = request_id
    LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."get_event"("request_id" "uuid") OWNER TO "supabase_admin";


CREATE OR REPLACE FUNCTION "public"."get_event_members"("target_event_id" "uuid") RETURNS TABLE("acknowledged_at" timestamp with time zone, "created_at" timestamp with time zone, "event_id" "uuid", "event_sent_at" timestamp with time zone, "id" "uuid", "user_id" "text", "user_name" "text", "user_email" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
eus.acknowledged_at,
eus.created_at,
eus.event_id,
eus.event_sent_at,
eus.id,
eus.user_id,
u.email as user_email, u.name as user_name
    FROM event_user_state eus
    LEFT JOIN "user" u ON u.id = eus.user_id
    WHERE eus.event_id = target_event_id
      AND EXISTS (
          SELECT 1
          FROM view_all_event_access vae
          WHERE vae.event_id = target_event_id
      );
END;
$$;


ALTER FUNCTION "public"."get_event_members"("target_event_id" "uuid") OWNER TO "supabase_admin";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."event_user_state" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "event_sent_at" timestamp with time zone,
    "acknowledged_at" timestamp with time zone
);


ALTER TABLE "public"."event_user_state" OWNER TO "supabase_admin";


CREATE OR REPLACE FUNCTION "public"."get_user_event_state"("target_event_id" "uuid", "requesting_user_id" "text") RETURNS SETOF "public"."event_user_state"
    LANGUAGE "plpgsql"
    AS $$BEGIN
    RETURN QUERY
    SELECT eus.*
    FROM event_user_state eus
    WHERE eus.event_id = target_event_id
      AND eus.user_id = requesting_user_id
      AND EXISTS (
          -- One simple check against our 4-way view
          SELECT 1
          FROM view_all_event_access vae
          WHERE vae.event_id = target_event_id
            AND vae.user_id = requesting_user_id
      );
END;$$;


ALTER FUNCTION "public"."get_user_event_state"("target_event_id" "uuid", "requesting_user_id" "text") OWNER TO "supabase_admin";


CREATE OR REPLACE FUNCTION "public"."get_user_events"("request_id" "text") RETURNS TABLE("id" "uuid", "title" "text", "description" "text", "from" timestamp with time zone, "to" timestamp with time zone, "created_by" "text", "created_at" timestamp with time zone, "type" "public"."event_type", "status" "public"."event_status", "event_group_id" "uuid", "event_user_name" "text", "event_user_email" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT e.id, e.title, e.description, e.from, e.to, e.created_by, e.created_at, e.type, e.status, e.event_group_id, u.name as event_user_name, u.email as event_user_email
    FROM event e

    LEFT JOIN "user" u ON e.created_by = u.id
    -- 1. Path via Event Groups (Team access)
    LEFT JOIN event_group_access ega ON e.event_group_id = ega.event_group_id
    LEFT JOIN user_group_member ugm ON ega.user_group_id = ugm.user_group_id

    -- 2. Path via Individual Event Access (One-off guests)
    LEFT JOIN event_access ea ON e.id = ea.event_id
    LEFT JOIN user_group_member ugm_direct ON ea.user_group_id = ugm_direct.user_group_id

    WHERE
        -- User is the creator
        e.created_by = request_id

        -- OR User has access via an Event Group (Directly or via a User Group)
        OR ega.user_id = request_id
        OR ugm.user_id = request_id

        -- OR User has access to the specific Event (Directly or via a User Group)
        OR ea.user_id = request_id
        OR ugm_direct.user_id = request_id;
END;
$$;


ALTER FUNCTION "public"."get_user_events"("request_id" "text") OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."account" (
    "id" "text" NOT NULL,
    "accountId" "text" NOT NULL,
    "providerId" "text" NOT NULL,
    "userId" "text" NOT NULL,
    "accessToken" "text",
    "refreshToken" "text",
    "idToken" "text",
    "accessTokenExpiresAt" timestamp with time zone,
    "refreshTokenExpiresAt" timestamp with time zone,
    "scope" "text",
    "password" "text",
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE "public"."account" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "from" timestamp with time zone NOT NULL,
    "to" timestamp with time zone,
    "created_by" "text" NOT NULL,
    "type" "public"."event_type" NOT NULL,
    "status" "public"."event_status" NOT NULL,
    "event_group_id" "uuid" NOT NULL
);


ALTER TABLE "public"."event" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."event_access" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "text" NOT NULL,
    "event_id" "uuid" NOT NULL,
    "role" integer NOT NULL,
    "user_group_id" "uuid"
);


ALTER TABLE "public"."event_access" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."event_group" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "created_by" "text" NOT NULL
);


ALTER TABLE "public"."event_group" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."event_group_access" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "event_group_id" "uuid" NOT NULL,
    "user_id" "text",
    "user_group_id" "uuid",
    "role" integer NOT NULL
);


ALTER TABLE "public"."event_group_access" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "priority" integer DEFAULT 1 NOT NULL,
    "type" "text" NOT NULL,
    "archived" timestamp with time zone,
    "payload" "jsonb",
    "user_id" "text" NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."session" (
    "id" "text" NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "token" "text" NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "ipAddress" "text",
    "userAgent" "text",
    "userId" "text" NOT NULL
);


ALTER TABLE "public"."session" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "emailVerified" boolean NOT NULL,
    "image" "text",
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."user" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_group" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "created_by" "text" NOT NULL
);


ALTER TABLE "public"."user_group" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."user_group_member" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "text" NOT NULL,
    "user_group_id" "uuid" NOT NULL
);


ALTER TABLE "public"."user_group_member" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."verification" (
    "id" "text" NOT NULL,
    "identifier" "text" NOT NULL,
    "value" "text" NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."verification" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."view_all_event_access" WITH ("security_invoker"='on') AS
 SELECT "e"."id" AS "event_id",
    "ega"."user_id"
   FROM ("public"."event" "e"
     JOIN "public"."event_group_access" "ega" ON (("e"."event_group_id" = "ega"."event_group_id")))
  WHERE ("ega"."user_id" IS NOT NULL)
UNION
 SELECT "e"."id" AS "event_id",
    "ugm"."user_id"
   FROM (("public"."event" "e"
     JOIN "public"."event_group_access" "ega" ON (("e"."event_group_id" = "ega"."event_group_id")))
     JOIN "public"."user_group_member" "ugm" ON (("ega"."user_group_id" = "ugm"."user_group_id")))
  WHERE ("ega"."user_group_id" IS NOT NULL)
UNION
 SELECT "ea"."event_id",
    "ea"."user_id"
   FROM "public"."event_access" "ea"
  WHERE ("ea"."user_id" IS NOT NULL)
UNION
 SELECT "ea"."event_id",
    "ugm"."user_id"
   FROM ("public"."event_access" "ea"
     JOIN "public"."user_group_member" "ugm" ON (("ea"."user_group_id" = "ugm"."user_group_id")))
  WHERE ("ea"."user_group_id" IS NOT NULL);


ALTER VIEW "public"."view_all_event_access" OWNER TO "supabase_admin";


ALTER TABLE ONLY "public"."account"
    ADD CONSTRAINT "account_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_access"
    ADD CONSTRAINT "event_access_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_group_access"
    ADD CONSTRAINT "event_group_map_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_group"
    ADD CONSTRAINT "event_group_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_user_state"
    ADD CONSTRAINT "event_user_state_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session"
    ADD CONSTRAINT "session_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session"
    ADD CONSTRAINT "session_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."user"
    ADD CONSTRAINT "user_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."user_group_member"
    ADD CONSTRAINT "user_group_member_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_group"
    ADD CONSTRAINT "user_group_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user"
    ADD CONSTRAINT "user_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."verification"
    ADD CONSTRAINT "verification_pkey" PRIMARY KEY ("id");



CREATE INDEX "account_userId_idx" ON "public"."account" USING "btree" ("userId");



CREATE INDEX "session_userId_idx" ON "public"."session" USING "btree" ("userId");



CREATE INDEX "verification_identifier_idx" ON "public"."verification" USING "btree" ("identifier");



ALTER TABLE ONLY "public"."account"
    ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_access"
    ADD CONSTRAINT "event_access_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_access"
    ADD CONSTRAINT "event_access_user_group_id_fkey" FOREIGN KEY ("user_group_id") REFERENCES "public"."user_group"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_access"
    ADD CONSTRAINT "event_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event"
    ADD CONSTRAINT "event_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event"
    ADD CONSTRAINT "event_event_group_id_fkey" FOREIGN KEY ("event_group_id") REFERENCES "public"."event_group"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_group_access"
    ADD CONSTRAINT "event_group_access_user_group_id_fkey" FOREIGN KEY ("user_group_id") REFERENCES "public"."user_group"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_group_access"
    ADD CONSTRAINT "event_group_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_group"
    ADD CONSTRAINT "event_group_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_group_access"
    ADD CONSTRAINT "event_group_map_event_group_id_fkey" FOREIGN KEY ("event_group_id") REFERENCES "public"."event_group"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_user_state"
    ADD CONSTRAINT "event_user_state_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_user_state"
    ADD CONSTRAINT "event_user_state_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session"
    ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_group"
    ADD CONSTRAINT "user_group_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_group_member"
    ADD CONSTRAINT "user_group_member_user_group_id_fkey" FOREIGN KEY ("user_group_id") REFERENCES "public"."user_group"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_group_member"
    ADD CONSTRAINT "user_group_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE "public"."account" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_access" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_group" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_group_access" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_user_state" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."session" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_group" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_group_member" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."verification" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."event_group_access";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";































































































































































GRANT ALL ON FUNCTION "public"."get_active_events"("requesting_user_id" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."get_active_events"("requesting_user_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_active_events"("requesting_user_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_active_events"("requesting_user_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_event"("request_id" "uuid") TO "postgres";
GRANT ALL ON FUNCTION "public"."get_event"("request_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_event"("request_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_event"("request_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_event_members"("target_event_id" "uuid") TO "postgres";
GRANT ALL ON FUNCTION "public"."get_event_members"("target_event_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_event_members"("target_event_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_event_members"("target_event_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."event_user_state" TO "postgres";
GRANT ALL ON TABLE "public"."event_user_state" TO "anon";
GRANT ALL ON TABLE "public"."event_user_state" TO "authenticated";
GRANT ALL ON TABLE "public"."event_user_state" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_event_state"("target_event_id" "uuid", "requesting_user_id" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."get_user_event_state"("target_event_id" "uuid", "requesting_user_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_event_state"("target_event_id" "uuid", "requesting_user_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_event_state"("target_event_id" "uuid", "requesting_user_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_events"("request_id" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."get_user_events"("request_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_events"("request_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_events"("request_id" "text") TO "service_role";


















GRANT ALL ON TABLE "public"."account" TO "anon";
GRANT ALL ON TABLE "public"."account" TO "authenticated";
GRANT ALL ON TABLE "public"."account" TO "service_role";



GRANT ALL ON TABLE "public"."event" TO "postgres";
GRANT ALL ON TABLE "public"."event" TO "anon";
GRANT ALL ON TABLE "public"."event" TO "authenticated";
GRANT ALL ON TABLE "public"."event" TO "service_role";



GRANT ALL ON TABLE "public"."event_access" TO "postgres";
GRANT ALL ON TABLE "public"."event_access" TO "anon";
GRANT ALL ON TABLE "public"."event_access" TO "authenticated";
GRANT ALL ON TABLE "public"."event_access" TO "service_role";



GRANT ALL ON TABLE "public"."event_group" TO "postgres";
GRANT ALL ON TABLE "public"."event_group" TO "anon";
GRANT ALL ON TABLE "public"."event_group" TO "authenticated";
GRANT ALL ON TABLE "public"."event_group" TO "service_role";



GRANT ALL ON TABLE "public"."event_group_access" TO "postgres";
GRANT ALL ON TABLE "public"."event_group_access" TO "anon";
GRANT ALL ON TABLE "public"."event_group_access" TO "authenticated";
GRANT ALL ON TABLE "public"."event_group_access" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "postgres";
GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."session" TO "anon";
GRANT ALL ON TABLE "public"."session" TO "authenticated";
GRANT ALL ON TABLE "public"."session" TO "service_role";



GRANT ALL ON TABLE "public"."user" TO "anon";
GRANT ALL ON TABLE "public"."user" TO "authenticated";
GRANT ALL ON TABLE "public"."user" TO "service_role";



GRANT ALL ON TABLE "public"."user_group" TO "postgres";
GRANT ALL ON TABLE "public"."user_group" TO "anon";
GRANT ALL ON TABLE "public"."user_group" TO "authenticated";
GRANT ALL ON TABLE "public"."user_group" TO "service_role";



GRANT ALL ON TABLE "public"."user_group_member" TO "postgres";
GRANT ALL ON TABLE "public"."user_group_member" TO "anon";
GRANT ALL ON TABLE "public"."user_group_member" TO "authenticated";
GRANT ALL ON TABLE "public"."user_group_member" TO "service_role";



GRANT ALL ON TABLE "public"."verification" TO "anon";
GRANT ALL ON TABLE "public"."verification" TO "authenticated";
GRANT ALL ON TABLE "public"."verification" TO "service_role";



GRANT ALL ON TABLE "public"."view_all_event_access" TO "postgres";
GRANT ALL ON TABLE "public"."view_all_event_access" TO "anon";
GRANT ALL ON TABLE "public"."view_all_event_access" TO "authenticated";
GRANT ALL ON TABLE "public"."view_all_event_access" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































