-- イベント・会場の本体。なければ作る。あれば列を足すだけ。
-- 日時→日付の変換は events-date-only.sql。カテゴリ固定は event-fields.sql。

create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  region text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  start_at date not null,
  end_at date,
  venue_id uuid references public.venues (id) on delete set null,
  location_text text,
  region text,
  genre text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

alter table public.events add column if not exists venue_id uuid;
alter table public.events add column if not exists location_text text;
alter table public.events add column if not exists region text;
alter table public.events add column if not exists genre text;
alter table public.events add column if not exists created_by uuid;
alter table public.events add column if not exists created_at timestamptz;
alter table public.events add column if not exists time_text text;
alter table public.events add column if not exists schedule_note text;
alter table public.events add column if not exists fee_text text;
alter table public.events add column if not exists organizer text;
alter table public.events add column if not exists contact_name text;
alter table public.events add column if not exists contact_phone text;
alter table public.events add column if not exists contact_email text;
alter table public.events add column if not exists website_url text;
alter table public.events add column if not exists parking_text text;

alter table public.venues add column if not exists address text;
alter table public.venues add column if not exists region text;
alter table public.venues add column if not exists created_by uuid;
alter table public.venues add column if not exists created_at timestamptz;
alter table public.venues add column if not exists description text;
alter table public.venues add column if not exists phone text;
alter table public.venues add column if not exists hours_text text;
alter table public.venues add column if not exists holiday_text text;
alter table public.venues add column if not exists fee_text text;
alter table public.venues add column if not exists access_transit text;
alter table public.venues add column if not exists access_car text;
alter table public.venues add column if not exists parking_text text;
alter table public.venues add column if not exists payment_text text;
alter table public.venues add column if not exists website_url text;
alter table public.venues add column if not exists sns_instagram text;
alter table public.venues add column if not exists sns_x text;
alter table public.venues add column if not exists sns_line text;

create index if not exists events_start_at_idx on public.events (start_at);
create index if not exists events_venue_id_idx on public.events (venue_id);
create index if not exists venues_region_idx on public.venues (region);

alter table public.events enable row level security;
alter table public.venues enable row level security;

drop policy if exists "Public can read events" on public.events;
create policy "Public can read events"
on public.events
for select
to anon, authenticated
using (true);

drop policy if exists "Users can insert own events" on public.events;
create policy "Users can insert own events"
on public.events
for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "Users can update own events" on public.events;
create policy "Users can update own events"
on public.events
for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

drop policy if exists "Users can delete own events" on public.events;
create policy "Users can delete own events"
on public.events
for delete
to authenticated
using (created_by = auth.uid());

drop policy if exists "Public can read venues" on public.venues;
create policy "Public can read venues"
on public.venues
for select
to anon, authenticated
using (true);

drop policy if exists "Users can insert own venues" on public.venues;
create policy "Users can insert own venues"
on public.venues
for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "Users can update own venues" on public.venues;
create policy "Users can update own venues"
on public.venues
for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

drop policy if exists "Users can delete own venues" on public.venues;
create policy "Users can delete own venues"
on public.venues
for delete
to authenticated
using (created_by = auth.uid());
