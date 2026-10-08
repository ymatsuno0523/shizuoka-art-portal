-- イベント詳細の閲覧数。施設・団体は対象外。
-- 何度 Run しても同じ結果。

alter table public.events
  add column if not exists view_count integer not null default 0;

create or replace function public.increment_event_view_count(p_event_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  update public.events
  set view_count = coalesce(view_count, 0) + 1
  where id = p_event_id
  returning view_count into new_count;

  return coalesce(new_count, 0);
end;
$$;

grant execute on function public.increment_event_view_count(uuid) to anon, authenticated;
