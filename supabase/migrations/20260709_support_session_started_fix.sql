-- Reset session_started_at for open threads where it was set after the first message
-- (forceOpenThread upsert used DB default now(), hiding messages from fetchSupportMessages).

update public.support_threads
set session_started_at = '1970-01-01T00:00:00.000Z'::timestamptz
where status = 'open'
  and session_started_at > '1970-01-02T00:00:00.000Z'::timestamptz;

update public.support_guest_threads
set session_started_at = '1970-01-01T00:00:00.000Z'::timestamptz
where status = 'open'
  and session_started_at > '1970-01-02T00:00:00.000Z'::timestamptz;
