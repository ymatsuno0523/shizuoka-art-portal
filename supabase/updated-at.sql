-- 会場・団体の一覧を更新順にするための列。
-- 何度 Run しても同じ結果。

alter table public.venues add column if not exists updated_at timestamptz;
alter table public.circles add column if not exists updated_at timestamptz;

update public.venues
set updated_at = coalesce(created_at, now())
where updated_at is null;

update public.circles
set updated_at = coalesce(created_at, now())
where updated_at is null;

alter table public.venues alter column updated_at set default now();
alter table public.venues alter column updated_at set not null;
alter table public.circles alter column updated_at set default now();
alter table public.circles alter column updated_at set not null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists venues_set_updated_at on public.venues;
create trigger venues_set_updated_at
before update on public.venues
for each row
execute function public.set_updated_at();

drop trigger if exists circles_set_updated_at on public.circles;
create trigger circles_set_updated_at
before update on public.circles
for each row
execute function public.set_updated_at();
