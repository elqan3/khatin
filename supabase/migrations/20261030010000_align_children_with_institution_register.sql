-- Align child records with the institution's official register.
-- Preserve existing date_of_birth and gender values; new records can use birth_year only.
alter table public.children
  alter column date_of_birth drop not null,
  alter column gender drop not null;

alter table public.children
  add column if not exists birth_year smallint,
  add column if not exists residence text,
  add column if not exists family_number text;

update public.children
set birth_year = extract(year from date_of_birth)::smallint
where birth_year is null and date_of_birth is not null;

alter table public.children
  add constraint children_birth_year_range
  check (birth_year is null or birth_year between 1900 and 2100);
