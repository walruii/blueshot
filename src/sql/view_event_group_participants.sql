CREATE OR REPLACE VIEW view_all_event_access AS
-- 1. event_group_access -> user_id (Direct Team Member)
SELECT
    e.id AS event_id,
    ega.user_id
FROM event e
JOIN event_group_access ega ON e.event_group_id = ega.event_group_id
WHERE ega.user_id IS NOT NULL

UNION

-- 2. event_group_access -> user_group_id (Team via User Group)
SELECT
    e.id AS event_id,
    ugm.user_id
FROM event e
JOIN event_group_access ega ON e.event_group_id = ega.event_group_id
JOIN user_group_member ugm ON ega.user_group_id = ugm.user_group_id
WHERE ega.user_group_id IS NOT NULL

UNION

-- 3. event_access -> user_id (Direct Event Guest)
SELECT
    ea.event_id,
    ea.user_id
FROM event_access ea
WHERE ea.user_id IS NOT NULL

UNION

-- 4. event_access -> user_group_id (Event Guest via User Group)
SELECT
    ea.event_id,
    ugm.user_id
FROM event_access ea
JOIN user_group_member ugm ON ea.user_group_id = ugm.user_group_id
WHERE ea.user_group_id IS NOT NULL;
