-- PDF資料（料金表・注意書きなど）。イベント・施設・団体それぞれ最大3件はアプリ側で制限。
-- 何度 Run しても同じ結果。

create table if not exists public.event_files (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  url text not null,
  label text not null default '資料',
  sort_order integer not null default 0,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create table if not exists public.venue_files (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  url text not null,
  label text not null default '資料',
  sort_order integer not null default 0,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create table if not exists public.circle_files (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles (id) on delete cascade,
  url text not null,
  label text not null default '資料',
  sort_order integer not null default 0,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index if not exists event_files_event_id_idx on public.event_files (event_id, sort_order);
create index if not exists venue_files_venue_id_idx on public.venue_files (venue_id, sort_order);
create index if not exists circle_files_circle_id_idx on public.circle_files (circle_id, sort_order);

alter table public.event_files enable row level security;
alter table public.venue_files enable row level security;
alter table public.circle_files enable row level security;

drop policy if exists "Public can read event files" on public.event_files;
create policy "Public can read event files"
on public.event_files for select to anon, authenticated using (true);

drop policy if exists "Owners can insert event files" on public.event_files;
create policy "Owners can insert event files"
on public.event_files for insert to authenticated
with check (
  created_by = auth.uid()
  and exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid())
);

drop policy if exists "Owners can update event files" on public.event_files;
create policy "Owners can update event files"
on public.event_files for update to authenticated
using (exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid()))
with check (exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid()));

drop policy if exists "Owners can delete event files" on public.event_files;
create policy "Owners can delete event files"
on public.event_files for delete to authenticated
using (exists (select 1 from public.events where events.id = event_id and events.created_by = auth.uid()));

drop policy if exists "Public can read venue files" on public.venue_files;
create policy "Public can read venue files"
on public.venue_files for select to anon, authenticated using (true);

drop policy if exists "Owners can insert venue files" on public.venue_files;
create policy "Owners can insert venue files"
on public.venue_files for insert to authenticated
with check (
  created_by = auth.uid()
  and exists (select 1 from public.venues where venues.id = venue_id and venues.created_by = auth.uid())
);

drop policy if exists "Owners can update venue files" on public.venue_files;
create policy "Owners can update venue files"
on public.venue_files for update to authenticated
using (exists (select 1 from public.venues where venues.id = venue_id and venues.created_by = auth.uid()))
with check (exists (select 1 from public.venues where venues.id = venue_id and venues.created_by = auth.uid()));

drop policy if exists "Owners can delete venue files" on public.venue_files;
create policy "Owners can delete venue files"
on public.venue_files for delete to authenticated
using (exists (select 1 from public.venues where venues.id = venue_id and venues.created_by = auth.uid()));

drop policy if exists "Public can read circle files" on public.circle_files;
create policy "Public can read circle files"
on public.circle_files for select to anon, authenticated using (true);

drop policy if exists "Owners can insert circle files" on public.circle_files;
create policy "Owners can insert circle files"
on public.circle_files for insert to authenticated
with check (
  created_by = auth.uid()
  and exists (select 1 from public.circles where circles.id = circle_id and circles.created_by = auth.uid())
);

drop policy if exists "Owners can update circle files" on public.circle_files;
create policy "Owners can update circle files"
on public.circle_files for update to authenticated
using (exists (select 1 from public.circles where circles.id = circle_id and circles.created_by = auth.uid()))
with check (exists (select 1 from public.circles where circles.id = circle_id and circles.created_by = auth.uid()));

drop policy if exists "Owners can delete circle files" on public.circle_files;
create policy "Owners can delete circle files"
on public.circle_files for delete to authenticated
using (exists (select 1 from public.circles where circles.id = circle_id and circles.created_by = auth.uid()));

grant select on public.event_files, public.venue_files, public.circle_files to anon, authenticated;
grant insert, update, delete on public.event_files, public.venue_files, public.circle_files to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'attachments',
  'attachments',
  true,
  8388608,
  array['application/pdf']
)
on conflict (id) do update
set
  public = true,
  file_size_limit = 8388608,
  allowed_mime_types = array['application/pdf'];

drop policy if exists "Public read attachments" on storage.objects;
create policy "Public read attachments"
on storage.objects
for select
to public
using (bucket_id = 'attachments');

drop policy if exists "Auth upload attachments" on storage.objects;
create policy "Auth upload attachments"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Auth update attachments" on storage.objects;
create policy "Auth update attachments"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Auth delete attachments" on storage.objects;
create policy "Auth delete attachments"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);
