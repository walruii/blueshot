CREATE OR REPLACE FUNCTION get_accessible_event_groups(p_user_id TEXT)
RETURNS SETOF event_group AS $$
BEGIN
    RETURN QUERY
    -- 1. OWNER: Direct ownership
    SELECT * FROM event_group
    WHERE created_by = p_user_id

    UNION

    -- 2. USER GROUPS: Permission via a group the user belongs to
    SELECT eg.* FROM event_group eg
    JOIN event_group_access ega ON eg.id = ega.event_group_id
    JOIN user_group_member ugm ON ega.user_group_id = ugm.user_group_id
    WHERE ugm.user_id = p_user_id
      AND ega.role >= 3

    UNION

    -- 3. DIRECT: Permission directly in the event_group_access table
    SELECT eg.* FROM event_group eg
    JOIN event_group_access ega ON eg.id = ega.event_group_id
    WHERE ega.user_id = p_user_id
      AND ega.role >= 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
