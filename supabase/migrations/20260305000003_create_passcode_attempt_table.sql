-- Create passcode_attempt table for rate limiting
create table if not exists passcode_attempt (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meeting(id) on delete cascade,
  ip_address inet not null,
  attempted_at timestamp with time zone default now(),

  constraint passcode_attempt_meeting_ip_unique unique (meeting_id, ip_address)
);

-- Create index for faster lookups and cleanup
create index if not exists idx_passcode_attempt_attempted_at on passcode_attempt(attempted_at);
create index if not exists idx_passcode_attempt_meeting_id on passcode_attempt(meeting_id);
