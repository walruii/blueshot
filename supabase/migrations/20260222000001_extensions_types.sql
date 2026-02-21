-- Extensions and shared types

CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";
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

CREATE TYPE "public"."event_status" AS ENUM (
    'cancel',
    'archive',
    'default'
);

CREATE TYPE "public"."event_type" AS ENUM (
    'allday',
    'default'
);
