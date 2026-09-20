-- イベント画像の実ファイル置き場（venue-images と同じ考え方）
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-images',
  'event-images',
  true,
  1048576,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = true,
  file_size_limit = 1048576,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "Public read event-images" on storage.objects;
create policy "Public read event-images"
on storage.objects
for select
to public
using (bucket_id = 'event-images');

drop policy if exists "Auth upload event-images" on storage.objects;
create policy "Auth upload event-images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'event-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Auth update event-images" on storage.objects;
create policy "Auth update event-images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'event-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Auth delete event-images" on storage.objects;
create policy "Auth delete event-images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'event-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
