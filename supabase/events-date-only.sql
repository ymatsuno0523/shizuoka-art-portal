-- イベントの開始・終了から時刻を外し、日付だけにする。
-- すでに date なら何もしない（何度 Run しても同じ）。
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'events'
      and column_name = 'start_at'
      and udt_name = 'timestamptz'
  ) then
    alter table public.events
      alter column start_at type date
      using ((start_at at time zone 'Asia/Tokyo')::date);
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'events'
      and column_name = 'end_at'
      and udt_name = 'timestamptz'
  ) then
    alter table public.events
      alter column end_at type date
      using (
        case
          when end_at is null then null
          else (end_at at time zone 'Asia/Tokyo')::date
        end
      );
  end if;
end $$;
