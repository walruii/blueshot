-- Add current user's role to group_conversations_inbox view
CREATE OR REPLACE VIEW group_conversations_inbox AS
SELECT
    cp_me.user_id AS current_user_id,
    cp_me.role AS current_user_role,
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
