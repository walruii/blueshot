CREATE OR REPLACE FUNCTION get_user_events(request_id UUID) -- Changed to UUID if that's your ID type
RETURNS SETOF event AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT e.*
    FROM event e
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
