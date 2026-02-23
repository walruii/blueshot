CREATE OR REPLACE FUNCTION get_event(target_event_id UUID, requesting_user_id text)
RETURNS TABLE (
    id uuid,
    title TEXT,
    description TEXT,
    "from" TIMESTAMP WITH TIME ZONE,
    "to" TIMESTAMP WITH TIME ZONE,
    created_by uuid,
    created_at TIMESTAMP WITH TIME ZONE,
    type event_type,
    status event_status,
    event_group_id uuid,
    event_user_name TEXT,
    event_user_email TEXT,
    user_role INT -- Return the role so the UI knows what to show
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id, e.title, e.description, e.from, e.to, e.created_by, e.created_at, e.type, e.status, e.event_group_id, 
        u.name as event_user_name, u.email as event_user_email,
        vae.role as user_role
    FROM event e
    LEFT JOIN "user" u ON e.created_by = u.id
    -- This INNER JOIN is your security gate
    INNER JOIN view_all_event_access vae ON e.id = vae.event_id
    WHERE e.id = target_event_id
      AND vae.user_id = requesting_user_id
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;