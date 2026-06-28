alter table guest_entries
  add column invite_adults_count integer,
  add column invite_kids_count integer;

update guest_entries
set
  invite_adults_count = ladies_count + gents_count,
  invite_kids_count = kids_count
where invite_adults_count is null;
