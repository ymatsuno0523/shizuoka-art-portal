-- イベント・施設・団体の共有用URL。空欄は null。何度 Run しても同じ結果。

alter table public.events add column if not exists slug text;
alter table public.venues add column if not exists slug text;
alter table public.circles add column if not exists slug text;

alter table public.events drop constraint if exists events_slug_check;
alter table public.events
  add constraint events_slug_check
  check (slug is null or (slug <> 'new' and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'));

alter table public.venues drop constraint if exists venues_slug_check;
alter table public.venues
  add constraint venues_slug_check
  check (slug is null or (slug <> 'new' and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'));

alter table public.circles drop constraint if exists circles_slug_check;
alter table public.circles
  add constraint circles_slug_check
  check (slug is null or (slug <> 'new' and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'));

create unique index if not exists events_slug_idx on public.events (slug);
create unique index if not exists venues_slug_idx on public.venues (slug);
create unique index if not exists circles_slug_idx on public.circles (slug);
