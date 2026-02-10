
  create table "public"."account" (
    "id" text not null,
    "accountId" text not null,
    "providerId" text not null,
    "userId" text not null,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" timestamp with time zone,
    "refreshTokenExpiresAt" timestamp with time zone,
    "scope" text,
    "password" text,
    "createdAt" timestamp with time zone not null default CURRENT_TIMESTAMP,
    "updatedAt" timestamp with time zone not null
      );


alter table "public"."account" enable row level security;


  create table "public"."event" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "title" text not null,
    "description" text not null,
    "date" timestamp with time zone not null,
    "from" timestamp with time zone not null,
    "to" timestamp with time zone,
    "user_id" text not null
      );


alter table "public"."event" enable row level security;


  create table "public"."event_participant" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "user_id" text not null,
    "event_id" uuid not null,
    "mail_sent" boolean not null default false,
    "acknowledgement" boolean not null default false
      );


alter table "public"."event_participant" enable row level security;


  create table "public"."session" (
    "id" text not null,
    "expiresAt" timestamp with time zone not null,
    "token" text not null,
    "createdAt" timestamp with time zone not null default CURRENT_TIMESTAMP,
    "updatedAt" timestamp with time zone not null,
    "ipAddress" text,
    "userAgent" text,
    "userId" text not null
      );


alter table "public"."session" enable row level security;


  create table "public"."user" (
    "id" text not null,
    "name" text not null,
    "email" text not null,
    "emailVerified" boolean not null,
    "image" text,
    "createdAt" timestamp with time zone not null default CURRENT_TIMESTAMP,
    "updatedAt" timestamp with time zone not null default CURRENT_TIMESTAMP
      );


alter table "public"."user" enable row level security;


  create table "public"."verification" (
    "id" text not null,
    "identifier" text not null,
    "value" text not null,
    "expiresAt" timestamp with time zone not null,
    "createdAt" timestamp with time zone not null default CURRENT_TIMESTAMP,
    "updatedAt" timestamp with time zone not null default CURRENT_TIMESTAMP
      );


alter table "public"."verification" enable row level security;

CREATE UNIQUE INDEX account_pkey ON public.account USING btree (id);

CREATE INDEX "account_userId_idx" ON public.account USING btree ("userId");

CREATE UNIQUE INDEX event_participants_pkey ON public.event_participant USING btree (id);

CREATE UNIQUE INDEX events_pkey ON public.event USING btree (id);

CREATE UNIQUE INDEX session_pkey ON public.session USING btree (id);

CREATE UNIQUE INDEX session_token_key ON public.session USING btree (token);

CREATE INDEX "session_userId_idx" ON public.session USING btree ("userId");

CREATE UNIQUE INDEX user_email_key ON public."user" USING btree (email);

CREATE UNIQUE INDEX user_pkey ON public."user" USING btree (id);

CREATE INDEX verification_identifier_idx ON public.verification USING btree (identifier);

CREATE UNIQUE INDEX verification_pkey ON public.verification USING btree (id);

alter table "public"."account" add constraint "account_pkey" PRIMARY KEY using index "account_pkey";

alter table "public"."event" add constraint "events_pkey" PRIMARY KEY using index "events_pkey";

alter table "public"."event_participant" add constraint "event_participants_pkey" PRIMARY KEY using index "event_participants_pkey";

alter table "public"."session" add constraint "session_pkey" PRIMARY KEY using index "session_pkey";

alter table "public"."user" add constraint "user_pkey" PRIMARY KEY using index "user_pkey";

alter table "public"."verification" add constraint "verification_pkey" PRIMARY KEY using index "verification_pkey";

alter table "public"."account" add constraint "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON DELETE CASCADE not valid;

alter table "public"."account" validate constraint "account_userId_fkey";

alter table "public"."event" add constraint "event_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."user"(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."event" validate constraint "event_user_id_fkey";

alter table "public"."event_participant" add constraint "event_participant_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."user"(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."event_participant" validate constraint "event_participant_user_id_fkey";

alter table "public"."event_participant" add constraint "event_participants_event_id_fkey" FOREIGN KEY (event_id) REFERENCES public.event(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."event_participant" validate constraint "event_participants_event_id_fkey";

alter table "public"."session" add constraint "session_token_key" UNIQUE using index "session_token_key";

alter table "public"."session" add constraint "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON DELETE CASCADE not valid;

alter table "public"."session" validate constraint "session_userId_fkey";

alter table "public"."user" add constraint "user_email_key" UNIQUE using index "user_email_key";

grant delete on table "public"."account" to "anon";

grant insert on table "public"."account" to "anon";

grant references on table "public"."account" to "anon";

grant select on table "public"."account" to "anon";

grant trigger on table "public"."account" to "anon";

grant truncate on table "public"."account" to "anon";

grant update on table "public"."account" to "anon";

grant delete on table "public"."account" to "authenticated";

grant insert on table "public"."account" to "authenticated";

grant references on table "public"."account" to "authenticated";

grant select on table "public"."account" to "authenticated";

grant trigger on table "public"."account" to "authenticated";

grant truncate on table "public"."account" to "authenticated";

grant update on table "public"."account" to "authenticated";

grant delete on table "public"."account" to "service_role";

grant insert on table "public"."account" to "service_role";

grant references on table "public"."account" to "service_role";

grant select on table "public"."account" to "service_role";

grant trigger on table "public"."account" to "service_role";

grant truncate on table "public"."account" to "service_role";

grant update on table "public"."account" to "service_role";

grant delete on table "public"."event" to "anon";

grant insert on table "public"."event" to "anon";

grant references on table "public"."event" to "anon";

grant select on table "public"."event" to "anon";

grant trigger on table "public"."event" to "anon";

grant truncate on table "public"."event" to "anon";

grant update on table "public"."event" to "anon";

grant delete on table "public"."event" to "authenticated";

grant insert on table "public"."event" to "authenticated";

grant references on table "public"."event" to "authenticated";

grant select on table "public"."event" to "authenticated";

grant trigger on table "public"."event" to "authenticated";

grant truncate on table "public"."event" to "authenticated";

grant update on table "public"."event" to "authenticated";

grant delete on table "public"."event" to "postgres";

grant insert on table "public"."event" to "postgres";

grant references on table "public"."event" to "postgres";

grant select on table "public"."event" to "postgres";

grant trigger on table "public"."event" to "postgres";

grant truncate on table "public"."event" to "postgres";

grant update on table "public"."event" to "postgres";

grant delete on table "public"."event" to "service_role";

grant insert on table "public"."event" to "service_role";

grant references on table "public"."event" to "service_role";

grant select on table "public"."event" to "service_role";

grant trigger on table "public"."event" to "service_role";

grant truncate on table "public"."event" to "service_role";

grant update on table "public"."event" to "service_role";

grant delete on table "public"."event_participant" to "anon";

grant insert on table "public"."event_participant" to "anon";

grant references on table "public"."event_participant" to "anon";

grant select on table "public"."event_participant" to "anon";

grant trigger on table "public"."event_participant" to "anon";

grant truncate on table "public"."event_participant" to "anon";

grant update on table "public"."event_participant" to "anon";

grant delete on table "public"."event_participant" to "authenticated";

grant insert on table "public"."event_participant" to "authenticated";

grant references on table "public"."event_participant" to "authenticated";

grant select on table "public"."event_participant" to "authenticated";

grant trigger on table "public"."event_participant" to "authenticated";

grant truncate on table "public"."event_participant" to "authenticated";

grant update on table "public"."event_participant" to "authenticated";

grant delete on table "public"."event_participant" to "postgres";

grant insert on table "public"."event_participant" to "postgres";

grant references on table "public"."event_participant" to "postgres";

grant select on table "public"."event_participant" to "postgres";

grant trigger on table "public"."event_participant" to "postgres";

grant truncate on table "public"."event_participant" to "postgres";

grant update on table "public"."event_participant" to "postgres";

grant delete on table "public"."event_participant" to "service_role";

grant insert on table "public"."event_participant" to "service_role";

grant references on table "public"."event_participant" to "service_role";

grant select on table "public"."event_participant" to "service_role";

grant trigger on table "public"."event_participant" to "service_role";

grant truncate on table "public"."event_participant" to "service_role";

grant update on table "public"."event_participant" to "service_role";

grant delete on table "public"."session" to "anon";

grant insert on table "public"."session" to "anon";

grant references on table "public"."session" to "anon";

grant select on table "public"."session" to "anon";

grant trigger on table "public"."session" to "anon";

grant truncate on table "public"."session" to "anon";

grant update on table "public"."session" to "anon";

grant delete on table "public"."session" to "authenticated";

grant insert on table "public"."session" to "authenticated";

grant references on table "public"."session" to "authenticated";

grant select on table "public"."session" to "authenticated";

grant trigger on table "public"."session" to "authenticated";

grant truncate on table "public"."session" to "authenticated";

grant update on table "public"."session" to "authenticated";

grant delete on table "public"."session" to "service_role";

grant insert on table "public"."session" to "service_role";

grant references on table "public"."session" to "service_role";

grant select on table "public"."session" to "service_role";

grant trigger on table "public"."session" to "service_role";

grant truncate on table "public"."session" to "service_role";

grant update on table "public"."session" to "service_role";

grant delete on table "public"."user" to "anon";

grant insert on table "public"."user" to "anon";

grant references on table "public"."user" to "anon";

grant select on table "public"."user" to "anon";

grant trigger on table "public"."user" to "anon";

grant truncate on table "public"."user" to "anon";

grant update on table "public"."user" to "anon";

grant delete on table "public"."user" to "authenticated";

grant insert on table "public"."user" to "authenticated";

grant references on table "public"."user" to "authenticated";

grant select on table "public"."user" to "authenticated";

grant trigger on table "public"."user" to "authenticated";

grant truncate on table "public"."user" to "authenticated";

grant update on table "public"."user" to "authenticated";

grant delete on table "public"."user" to "service_role";

grant insert on table "public"."user" to "service_role";

grant references on table "public"."user" to "service_role";

grant select on table "public"."user" to "service_role";

grant trigger on table "public"."user" to "service_role";

grant truncate on table "public"."user" to "service_role";

grant update on table "public"."user" to "service_role";

grant delete on table "public"."verification" to "anon";

grant insert on table "public"."verification" to "anon";

grant references on table "public"."verification" to "anon";

grant select on table "public"."verification" to "anon";

grant trigger on table "public"."verification" to "anon";

grant truncate on table "public"."verification" to "anon";

grant update on table "public"."verification" to "anon";

grant delete on table "public"."verification" to "authenticated";

grant insert on table "public"."verification" to "authenticated";

grant references on table "public"."verification" to "authenticated";

grant select on table "public"."verification" to "authenticated";

grant trigger on table "public"."verification" to "authenticated";

grant truncate on table "public"."verification" to "authenticated";

grant update on table "public"."verification" to "authenticated";

grant delete on table "public"."verification" to "service_role";

grant insert on table "public"."verification" to "service_role";

grant references on table "public"."verification" to "service_role";

grant select on table "public"."verification" to "service_role";

grant trigger on table "public"."verification" to "service_role";

grant truncate on table "public"."verification" to "service_role";

grant update on table "public"."verification" to "service_role";


  create policy "Allow anon users to listen"
  on "realtime"."messages"
  as permissive
  for select
  to anon
using (true);



  create policy "Allow service_role to send"
  on "realtime"."messages"
  as permissive
  for insert
  to service_role
with check (true);



