alter table guest_entries
  add column invite_all_adults boolean not null default false,
  add column invite_all_kids boolean not null default false;
