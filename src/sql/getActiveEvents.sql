DROP FUNCTION get_active_events(text);
CREATE OR REPLACE FUNCTION get_active_events(requesting_user_id text)
RETURNS TABLE (
    id uuid,
    title TEXT,
    "description" TEXT,
    "from" TIMESTAMP WITH TIME ZONE,
    "to" TIMESTAMP WITH TIME ZONE,
    created_by text,
    created_at TIMESTAMP WITH TIME ZONE,
    "type" "event_type",
    "status" "event_status",
    event_group_id uuid,
    event_user_name TEXT,
    event_user_email TEXT
) AS $$

BEGIN
    RETURN QUERY
    SELECT DISTINCT e.id, e.title, e.description, e.from, e.to, e.created_by, e.created_at, e.type, e.status, e.event_group_id, u.name as event_user_name, u.email as event_user_email
    FROM event e

    LEFT JOIN "user" u ON e.created_by = u.id
    WHERE e."to" > NOW()
    AND EXISTS (
        SELECT 1
        FROM view_all_event_access vae
        WHERE vae.event_id = e.id
        AND vae.user_id = requesting_user_id
    )
    ORDER BY e.from;

END;
$$ LANGUAGE plpgsql;
