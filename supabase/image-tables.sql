-- 画像の実体は Storage。このテーブルは URL を1枚1行で持つ。
-- SQL Editor で実行する。

-- ========== イベント画像 ==========
create table if not exists public.event_images (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  url text not null,
  sort_order integer not null default 0,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index if not exists event_images_event_id_idx
  on public.event_images (event_id, sort_order);

alter table public.event_images enable row level security;

drop policy if exists "Public can read event images" on public.event_images;
create policy "Public can read event images"
on public.event_images
for select
to anon, authenticated
using (true);

drop policy if exists "Owners can insert event images" on public.event_images;
create policy "Owners can insert event images"
on public.event_images
for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1 from public.events
    where events.id = event_id
      and events.created_by = auth.uid()
  )
);

drop policy if exists "Owners can update event images" on public.event_images;
create policy "Owners can update event images"
on public.event_images
for update
to authenticated
using (
  exists (
    select 1 from public.events
    where events.id = event_id
      and events.created_by = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.events
    where events.id = event_id
      and events.created_by = auth.uid()
  )
);

drop policy if exists "Owners can delete event images" on public.event_images;
create policy "Owners can delete event images"
on public.event_images
for delete
to authenticated
using (
  exists (
    select 1 from public.events
    where events.id = event_id
      and events.created_by = auth.uid()
  )
);

-- ========== 会場・施設画像 ==========
create table if not exists public.venue_images (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  url text not null,
  sort_order integer not null default 0,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index if not exists venue_images_venue_id_idx
  on public.venue_images (venue_id, sort_order);

alter table public.venue_images enable row level security;

drop policy if exists "Public can read venue images" on public.venue_images;
create policy "Public can read venue images"
on public.venue_images
for select
to anon, authenticated
using (true);

drop policy if exists "Owners can insert venue images" on public.venue_images;
create policy "Owners can insert venue images"
on public.venue_images
for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1 from public.venues
    where venues.id = venue_id
      and venues.created_by = auth.uid()
  )
);

drop policy if exists "Owners can update venue images" on public.venue_images;
create policy "Owners can update venue images"
on public.venue_images
for update
to authenticated
using (
  exists (
    select 1 from public.venues
    where venues.id = venue_id
      and venues.created_by = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.venues
    where venues.id = venue_id
      and venues.created_by = auth.uid()
  )
);

drop policy if exists "Owners can delete venue images" on public.venue_images;
create policy "Owners can delete venue images"
on public.venue_images
for delete
to authenticated
using (
  exists (
    select 1 from public.venues
    where venues.id = venue_id
      and venues.created_by = auth.uid()
  )
);
