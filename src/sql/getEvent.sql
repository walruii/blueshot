DROP FUNCTION get_event(text);
CREATE OR REPLACE FUNCTION get_event(request_id uuid)
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
    WHERE e.id = request_id
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;
