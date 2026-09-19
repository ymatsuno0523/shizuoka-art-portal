-- イベントは誰でも読める（既存の SELECT ポリシーはそのまま）
-- 書く・消すはログインユーザーの自分の行だけ

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
