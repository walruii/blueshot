-- Add current user's role to group_conversations_inbox view
DROP VIEW IF EXISTS group_conversations_inbox;

CREATE VIEW group_conversations_inbox AS
SELECT
    cp_me.user_id AS current_user_id,
    c.avatar_url,
    c.created_at,
    c.description,
    c.event_group_id,
    c.event_id,
    c.id,
    c.last_message_at,
    c.name,
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
        ), '[]'::json) AS participants,
    c.type,
    c.updated_at,
    c.user_group_id,
    cp_me.role AS current_user_role,
    CASE
        WHEN c.type = 'user_group' THEN EXISTS (
            SELECT 1
            FROM user_group ug
            WHERE ug.id = c.user_group_id
              AND ug.created_by = cp_me.user_id
        )
        WHEN c.type = 'event_group' THEN (
            EXISTS (
                SELECT 1
                FROM event_group eg
                WHERE eg.id = c.event_group_id
                  AND eg.created_by = cp_me.user_id
            )
            OR EXISTS (
                SELECT 1
                FROM event_group_access ega
                WHERE ega.event_group_id = c.event_group_id
                  AND ega.user_id = cp_me.user_id
                  AND ega.role >= 2
            )
            OR EXISTS (
                SELECT 1
                FROM event_group_access ega
                JOIN user_group_member ugm ON ugm.user_group_id = ega.user_group_id
                WHERE ega.event_group_id = c.event_group_id
                  AND ugm.user_id = cp_me.user_id
                  AND ega.role >= 2
            )
        )
        ELSE false
    END AS current_user_can_manage
FROM conversation_participant cp_me
JOIN conversation c ON cp_me.conversation_id = c.id
WHERE c.type != 'direct';
