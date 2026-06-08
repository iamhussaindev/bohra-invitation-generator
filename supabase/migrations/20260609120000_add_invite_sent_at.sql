alter table guest_entries
  add column if not exists invite_sent_at timestamptz;

create index if not exists guest_entries_invite_sent_at_idx
  on guest_entries(invite_sent_at)
  where invite_sent_at is not null;
