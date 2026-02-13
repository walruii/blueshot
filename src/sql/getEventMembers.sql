DROP FUNCTION get_event_members(uuid);
CREATE OR REPLACE FUNCTION get_event_members(
    target_event_id UUID
)
RETURNS TABLE (
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    event_id UUID,
    event_sent_at TIMESTAMP WITH TIME ZONE,
    id UUID,
    user_id text,
    user_name text,
    user_email text
)
AS $$
BEGIN
    RETURN QUERY
    SELECT
      eus.acknowledged_at,
      eus.created_at,
      eus.event_id,
      eus.event_sent_at,
      eus.id,
      eus.user_id,
      u.email as user_email, u.name as user_name
    FROM event_user_state eus
    LEFT JOIN "user" u ON u.id = eus.user_id
    WHERE eus.event_id = target_event_id
      AND EXISTS (
          SELECT 1
          FROM view_all_event_access vae
          WHERE vae.event_id = target_event_id
      );
END;
$$ LANGUAGE plpgsql;
