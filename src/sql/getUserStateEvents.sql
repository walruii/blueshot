CREATE OR REPLACE FUNCTION get_user_event_state(
    target_event_id UUID,
    requesting_user_id text
)
RETURNS SETOF event_user_state
AS $$
BEGIN
    RETURN QUERY
    SELECT eus.*
    FROM event_user_state eus
    WHERE eus.event_id = target_event_id
      AND eus.user_id = requesting_user_id
      AND EXISTS (
          -- One simple check against our 4-way view
          SELECT 1
          FROM view_all_event_access vae
          WHERE vae.event_id = target_event_id
            AND vae.user_id = requesting_user_id
      );
END;
$$ LANGUAGE plpgsql;
