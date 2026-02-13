DROP FUNCTION get_user_events(text);
CREATE OR REPLACE FUNCTION get_user_events(request_id TEXT)
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
    -- 1. Path via Event Groups (Team access)
    LEFT JOIN event_group_access ega ON e.event_group_id = ega.event_group_id
    LEFT JOIN user_group_member ugm ON ega.user_group_id = ugm.user_group_id

    -- 2. Path via Individual Event Access (One-off guests)
    LEFT JOIN event_access ea ON e.id = ea.event_id
    LEFT JOIN user_group_member ugm_direct ON ea.user_group_id = ugm_direct.user_group_id

    WHERE
        -- User is the creator
        e.created_by = request_id

        -- OR User has access via an Event Group (Directly or via a User Group)
        OR ega.user_id = request_id
        OR ugm.user_id = request_id

        -- OR User has access to the specific Event (Directly or via a User Group)
        OR ea.user_id = request_id
        OR ugm_direct.user_id = request_id;
END;
$$ LANGUAGE plpgsql;
