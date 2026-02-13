


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

SET default_tablespace = '';

SET default_table_access_method = "heap";


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


CREATE TABLE IF NOT EXISTS "public"."event_user_state" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "source_group_id" "uuid" NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "event_sent_at" timestamp with time zone,
    "acknowledged_at" timestamp with time zone
);


ALTER TABLE "public"."event_user_state" OWNER TO "supabase_admin";


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
    ADD CONSTRAINT "event_access_user_group_id_fkey" FOREIGN KEY ("user_group_id") REFERENCES "public"."user_group_member"("id") ON UPDATE CASCADE ON DELETE CASCADE;



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
    ADD CONSTRAINT "event_user_state_source_group_id_fkey" FOREIGN KEY ("source_group_id") REFERENCES "public"."event_group"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_user_state"
    ADD CONSTRAINT "event_user_state_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;



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



GRANT ALL ON TABLE "public"."event_user_state" TO "postgres";
GRANT ALL ON TABLE "public"."event_user_state" TO "anon";
GRANT ALL ON TABLE "public"."event_user_state" TO "authenticated";
GRANT ALL ON TABLE "public"."event_user_state" TO "service_role";



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































