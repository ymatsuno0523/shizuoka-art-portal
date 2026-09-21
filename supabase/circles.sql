-- 団体（サークル・教室・企業・その他）+ 画像テーブル + Storage
-- テーブル名は circles のまま。画面上の呼び方は団体。
-- イベントへの紐づけは、circles と events の両方があるときだけ足す。
create table if not exists public.circles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  address text,
  region text,
  genre text,
  kind text not null default 'サークル',
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

alter table public.circles add column if not exists kind text;
alter table public.circles add column if not exists representative text;
alter table public.circles add column if not exists phone text;
alter table public.circles add column if not exists email text;
alter table public.circles add column if not exists website_url text;
alter table public.circles add column if not exists sns_instagram text;
alter table public.circles add column if not exists sns_x text;
alter table public.circles add column if not exists sns_line text;

update public.circles set kind = '教室・スクール' where kind in ('スクール', '教室');
update public.circles set kind = '企業・スタジオ' where kind = '企業';
update public.circles
set kind = 'その他'
where kind is null
   or kind not in (
     'サークル',
     '教室・スクール',
     '企業・スタジオ',
     'その他'
   );

alter table public.circles
  alter column kind set default 'サークル';

alter table public.circles
  alter column kind set not null;

alter table public.circles drop constraint if exists circles_kind_check;
alter table public.circles
  add constraint circles_kind_check
  check (
    kind in (
      'サークル',
      '教室・スクール',
      '企業・スタジオ',
      'その他'
    )
  );

do $$
begin
  if to_regclass('public.events') is not null then
    alter table public.events
      add column if not exists circle_id uuid references public.circles (id) on delete set null;
    execute 'create index if not exists events_circle_id_idx on public.events (circle_id)';
  end if;
end $$;

alter table public.circles enable row level security;

drop policy if exists "Public can read circles" on public.circles;
create policy "Public can read circles"
on public.circles
for select
to anon, authenticated
using (true);

drop policy if exists "Users can insert own circles" on public.circles;
create policy "Users can insert own circles"
on public.circles
for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "Users can update own circles" on public.circles;
create policy "Users can update own circles"
on public.circles
for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

drop policy if exists "Users can delete own circles" on public.circles;
create policy "Users can delete own circles"
on public.circles
for delete
to authenticated
using (created_by = auth.uid());

create table if not exists public.circle_images (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles (id) on delete cascade,
  url text not null,
  sort_order integer not null default 0,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index if not exists circle_images_circle_id_idx
  on public.circle_images (circle_id, sort_order);

alter table public.circle_images enable row level security;

drop policy if exists "Public can read circle images" on public.circle_images;
create policy "Public can read circle images"
on public.circle_images
for select
to anon, authenticated
using (true);

drop policy if exists "Owners can insert circle images" on public.circle_images;
create policy "Owners can insert circle images"
on public.circle_images
for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1 from public.circles
    where circles.id = circle_id
      and circles.created_by = auth.uid()
  )
);

drop policy if exists "Owners can update circle images" on public.circle_images;
create policy "Owners can update circle images"
on public.circle_images
for update
to authenticated
using (
  exists (
    select 1 from public.circles
    where circles.id = circle_id
      and circles.created_by = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.circles
    where circles.id = circle_id
      and circles.created_by = auth.uid()
  )
);

drop policy if exists "Owners can delete circle images" on public.circle_images;
create policy "Owners can delete circle images"
on public.circle_images
for delete
to authenticated
using (
  exists (
    select 1 from public.circles
    where circles.id = circle_id
      and circles.created_by = auth.uid()
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'circle-images',
  'circle-images',
  true,
  1048576,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = true,
  file_size_limit = 1048576,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "Public read circle-images" on storage.objects;
create policy "Public read circle-images"
on storage.objects
for select
to public
using (bucket_id = 'circle-images');

drop policy if exists "Auth upload circle-images" on storage.objects;
create policy "Auth upload circle-images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'circle-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Auth update circle-images" on storage.objects;
create policy "Auth update circle-images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'circle-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Auth delete circle-images" on storage.objects;
create policy "Auth delete circle-images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'circle-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
