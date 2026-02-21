-- Auth-related tables (excluding user)

CREATE TABLE "public"."account" (
    "id" "text" PRIMARY KEY,
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

CREATE INDEX "account_userId_idx" ON "public"."account" USING "btree" ("userId");

CREATE TABLE "public"."passkey" (
    "id" "text" PRIMARY KEY,
    "name" "text",
    "publicKey" "text" NOT NULL,
    "userId" "text" NOT NULL,
    "credentialID" "text" NOT NULL,
    "counter" integer NOT NULL,
    "deviceType" "text" NOT NULL,
    "backedUp" boolean NOT NULL,
    "transports" "text",
    "createdAt" timestamp with time zone,
    "aaguid" "text"
);

CREATE INDEX "passkey_credentialID_idx" ON "public"."passkey" USING "btree" ("credentialID");
CREATE INDEX "passkey_userId_idx" ON "public"."passkey" USING "btree" ("userId");

CREATE TABLE "public"."session" (
    "id" "text" PRIMARY KEY,
    "expiresAt" timestamp with time zone NOT NULL,
    "token" "text" NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "ipAddress" "text",
    "userAgent" "text",
    "userId" "text" NOT NULL,
    CONSTRAINT "session_token_key" UNIQUE ("token")
);

CREATE INDEX "session_userId_idx" ON "public"."session" USING "btree" ("userId");

CREATE TABLE "public"."twoFactor" (
    "id" "text" PRIMARY KEY,
    "secret" "text" NOT NULL,
    "backupCodes" "text" NOT NULL,
    "userId" "text" NOT NULL
);

CREATE INDEX "twoFactor_secret_idx" ON "public"."twoFactor" USING "btree" ("secret");
CREATE INDEX "twoFactor_userId_idx" ON "public"."twoFactor" USING "btree" ("userId");

CREATE TABLE "public"."verification" (
    "id" "text" PRIMARY KEY,
    "identifier" "text" NOT NULL,
    "value" "text" NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX "verification_identifier_idx" ON "public"."verification" USING "btree" ("identifier");

ALTER TABLE "public"."account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."passkey" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."twoFactor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."verification" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON "public"."account"
FOR ALL
TO service_role
USING ((select auth.role()) = 'service_role')
WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "service_role_all" ON "public"."passkey"
FOR ALL
TO service_role
USING ((select auth.role()) = 'service_role')
WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "service_role_all" ON "public"."session"
FOR ALL
TO service_role
USING ((select auth.role()) = 'service_role')
WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "service_role_all" ON "public"."twoFactor"
FOR ALL
TO service_role
USING ((select auth.role()) = 'service_role')
WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "service_role_all" ON "public"."verification"
FOR ALL
TO service_role
USING ((select auth.role()) = 'service_role')
WITH CHECK ((select auth.role()) = 'service_role');
