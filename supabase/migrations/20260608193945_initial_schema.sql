-- Guest sections and entries for boarding pass invites
create table guest_sections (
  id text primary key,
  section_name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table guest_entries (
  id text primary key,
  section_id text not null references guest_sections(id) on delete cascade,
  original_text text not null,
  cleaned_names text not null,
  gender text not null default 'mixed' check (gender in ('ladies', 'gents', 'mixed')),
  ladies_count integer not null default 0,
  gents_count integer not null default 0,
  kids_count integer not null default 0,
  total_count integer not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table rsvp_records (
  id text primary key,
  name text not null,
  status text not null check (status in ('Accepted', 'Declined')),
  ladies integer not null default 0,
  gents integer not null default 0,
  kids integer not null default 0,
  confirmation_code text,
  guest_entry_id text,
  created_at timestamptz not null default now()
);

create index guest_entries_section_id_idx on guest_entries(section_id);
create index rsvp_records_created_at_idx on rsvp_records(created_at desc);

alter table guest_sections enable row level security;
alter table guest_entries enable row level security;
alter table rsvp_records enable row level security;

create policy "guest_sections_all" on guest_sections for all using (true) with check (true);
create policy "guest_entries_all" on guest_entries for all using (true) with check (true);
create policy "rsvp_records_all" on rsvp_records for all using (true) with check (true);
