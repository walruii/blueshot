drop function if exists "public"."get_event"(request_id uuid);

drop function if exists "public"."get_user_events"(request_id text);

drop index if exists "public"."meetings_video_sdk_meeting_id_key";

alter table "public"."event" add column "meeting_id" uuid;

alter table "public"."meeting" drop column "video_sdk_meeting_id";

alter table "public"."meeting" add column "room_id" text not null;

CREATE UNIQUE INDEX meetings_video_sdk_meeting_id_key ON public.meeting USING btree (room_id);

alter table "public"."event" add constraint "event_meeting_id_fkey" FOREIGN KEY (meeting_id) REFERENCES public.meeting(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."event" validate constraint "event_meeting_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_event(target_event_id uuid, requesting_user_id text)
 RETURNS TABLE(id uuid, title text, description text, "from" timestamp with time zone, "to" timestamp with time zone, created_by uuid, created_at timestamp with time zone, type public.event_type, status public.event_status, event_group_id uuid, event_user_name text, event_user_email text, user_role integer)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        e.id, e.title, e.description, e.from, e.to, e.created_by, e.created_at, e.type, e.status, e.event_group_id, 
        u.name as event_user_name, u.email as event_user_email,
        vae.role as user_role
    FROM event e
    LEFT JOIN "user" u ON e.created_by = u.id
    -- This INNER JOIN is your security gate
    INNER JOIN view_all_event_access vae ON e.id = vae.event_id
    WHERE e.id = target_event_id
      AND vae.user_id = requesting_user_id
    LIMIT 1;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_events(request_id text)
 RETURNS TABLE(id uuid, title text, description text, "from" timestamp with time zone, "to" timestamp with time zone, created_by text, created_at timestamp with time zone, type public.event_type, status public.event_status, event_group_id uuid, event_user_name text, event_user_email text, user_role integer)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT DISTINCT 
        e.id, e.title, e.description, e.from, e.to, e.created_by, e.created_at, e.type, e.status, e.event_group_id, 
        u.name as event_user_name, u.email as event_user_email,
        vae.role as user_role
    FROM event e
    LEFT JOIN "user" u ON e.created_by = u.id
    -- JOIN TO THE VIEW INSTEAD OF MANUAL LOGIC
    INNER JOIN view_all_event_access vae ON e.id = vae.event_id
    WHERE vae.user_id = request_id;
END;
$function$
;

create or replace view "public"."view_all_event_access" as  WITH raw_access AS (
         SELECT e.id AS event_id,
            e.created_by AS user_id,
            3 AS role
           FROM public.event e
        UNION ALL
         SELECT e.id AS event_id,
            ega.user_id,
            ega.role
           FROM (public.event e
             JOIN public.event_group_access ega ON ((e.event_group_id = ega.event_group_id)))
          WHERE (ega.user_id IS NOT NULL)
        UNION ALL
         SELECT e.id AS event_id,
            ugm.user_id,
            ega.role
           FROM ((public.event e
             JOIN public.event_group_access ega ON ((e.event_group_id = ega.event_group_id)))
             JOIN public.user_group_member ugm ON ((ega.user_group_id = ugm.user_group_id)))
        UNION ALL
         SELECT ea.event_id,
            ea.user_id,
            ea.role
           FROM public.event_access ea
          WHERE (ea.user_id IS NOT NULL)
        UNION ALL
         SELECT ea.event_id,
            ugm.user_id,
            ea.role
           FROM (public.event_access ea
             JOIN public.user_group_member ugm ON ((ea.user_group_id = ugm.user_group_id)))
        )
 SELECT event_id,
    user_id,
    max(role) AS role
   FROM raw_access
  GROUP BY event_id, user_id;



