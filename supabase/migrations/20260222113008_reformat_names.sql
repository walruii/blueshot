
alter table "public"."conversation_participants" rename to "conversation_participant";

alter table "public"."conversations" rename to "conversation";

alter table "public"."meeting_events" rename to "meeting_event";

alter table "public"."meeting_participants" rename to "meeting_participant";

alter table "public"."meetings" rename to "meeting";

alter table "public"."messages" rename to "message";

alter table "public"."notifications" rename to "notification";


CREATE OR REPLACE VIEW direct_messages_inbox AS
SELECT
    cp1.user_id AS current_user_id,
    c.*,
    u.id AS partner_id,
    u.name AS partner_name,
    u.email AS partner_email,
    u.image AS partner_image
FROM conversation_participant cp1
JOIN conversation c ON cp1.conversation_id = c.id
JOIN conversation_participant cp2 ON c.id = cp2.conversation_id AND cp1.user_id != cp2.user_id
JOIN "user" u ON cp2.user_id = u.id
WHERE c.type = 'direct';

CREATE OR REPLACE VIEW group_conversations_inbox AS
SELECT
    cp_me.user_id AS current_user_id,
    c.*,
    -- Aggregate all participants EXCEPT the current user into a JSON array
    COALESCE(
        (SELECT json_agg(json_build_object(
            'id', u.id,
            'name', u.name,
            'email', u.email,
            'image', u.image,
            'role', cp_others.role
        ))
        FROM conversation_participant cp_others
        JOIN "user" u ON cp_others.user_id = u.id
        WHERE cp_others.conversation_id = c.id
        AND cp_others.user_id != cp_me.user_id
        ), '[]'::json) AS participants
FROM conversation_participant cp_me
JOIN conversation c ON cp_me.conversation_id = c.id
WHERE c.type != 'direct';
