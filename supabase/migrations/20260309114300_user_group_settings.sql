CREATE OR REPLACE FUNCTION get_accessible_user_groups(p_user_id TEXT)
RETURNS SETOF user_group AS $$
BEGIN
    RETURN QUERY
    -- 1. Get groups created by the user (Ownership)
    SELECT * FROM user_group
    WHERE created_by = p_user_id

    UNION

    -- 2. Get groups the user is a member of (Membership)
    -- We join the membership table to the group table to get the full rows
    SELECT ug.* FROM user_group ug
    JOIN user_group_member ugm ON ug.id = ugm.user_group_id
    WHERE ugm.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
