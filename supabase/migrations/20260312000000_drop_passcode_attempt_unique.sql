-- Drop unique constraint on (meeting_id, ip_address) to allow multiple users
-- from the same IP to attempt passcode entry independently.
ALTER TABLE passcode_attempt
  DROP CONSTRAINT IF EXISTS passcode_attempt_meeting_ip_unique;
