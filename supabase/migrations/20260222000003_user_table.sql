-- User table and auth foreign keys

CREATE TABLE "public"."user" (
    "id" "text" PRIMARY KEY,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "emailVerified" boolean NOT NULL,
    "image" "text",
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "twoFactorEnabled" boolean
);

ALTER TABLE "public"."user" ADD CONSTRAINT "user_email_key" UNIQUE ("email");

ALTER TABLE "public"."user" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON "public"."user"
FOR ALL
TO service_role
USING ((select auth.role()) = 'service_role')
WITH CHECK ((select auth.role()) = 'service_role');

ALTER TABLE "public"."account"
    ADD CONSTRAINT "account_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE;

ALTER TABLE "public"."passkey"
    ADD CONSTRAINT "passkey_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE;

ALTER TABLE "public"."session"
    ADD CONSTRAINT "session_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE;

ALTER TABLE "public"."twoFactor"
    ADD CONSTRAINT "twoFactor_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE;
