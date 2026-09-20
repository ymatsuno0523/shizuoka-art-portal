-- イベントは event_images に移したので、旧カラムは不要
alter table public.events drop column if exists image_url;

-- 施設画像の実ファイル置き場
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'venue-images',
  'venue-images',
  true,
  1048576,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = true,
  file_size_limit = 1048576,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "Public read venue-images" on storage.objects;
create policy "Public read venue-images"
on storage.objects
for select
to public
using (bucket_id = 'venue-images');

drop policy if exists "Auth upload venue-images" on storage.objects;
create policy "Auth upload venue-images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'venue-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Auth update venue-images" on storage.objects;
create policy "Auth update venue-images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'venue-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Auth delete venue-images" on storage.objects;
create policy "Auth delete venue-images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'venue-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
