alter table "public"."message" drop column "sent_during_meeting";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_existing_direct_conversation(user_a text, user_b text)
 RETURNS uuid
 LANGUAGE sql
AS $function$
  SELECT cp1.conversation_id
  FROM conversation_participant cp1
  JOIN conversation_participant cp2 ON cp1.conversation_id = cp2.conversation_id
  JOIN conversation c ON c.id = cp1.conversation_id
  WHERE cp1.user_id = user_a 
    AND cp2.user_id = user_b 
    AND c.type = 'direct'
  LIMIT 1;
$function$
;


