-- Notifications

CREATE TABLE "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "title" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "priority" integer DEFAULT 1 NOT NULL,
    "type" "text" NOT NULL,
    "archived" timestamp with time zone,
    "payload" "jsonb",
    "user_id" "text" NOT NULL
);

CREATE INDEX "notifications_user_id_idx" ON "public"."notifications" USING "btree" ("user_id");
CREATE INDEX "notifications_created_at_idx" ON "public"."notifications" USING "btree" ("created_at");

ALTER TABLE "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON "public"."notifications"
FOR ALL
TO service_role
USING ((select auth.role()) = 'service_role')
WITH CHECK ((select auth.role()) = 'service_role');
