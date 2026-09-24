-- アカウント削除後もイベント・施設・団体は残す。作成者の紐づけだけ外す。
-- プロフィール行はアカウントと一緒に消える。何度 Run しても同じ結果。

do $$
declare
  target record;
begin
  for target in
    select ns.nspname as schema_name, cls.relname as table_name, con.conname as constraint_name
    from pg_constraint con
    join pg_class cls on cls.oid = con.conrelid
    join pg_namespace ns on ns.oid = cls.relnamespace
    join pg_attribute att on att.attrelid = cls.oid and att.attnum = any (con.conkey)
    where con.contype = 'f'
      and ns.nspname = 'public'
      and att.attname = 'created_by'
      and con.confrelid = 'auth.users'::regclass
  loop
    execute format(
      'alter table %I.%I drop constraint %I',
      target.schema_name,
      target.table_name,
      target.constraint_name
    );
  end loop;
end $$;

do $$
declare
  target text;
begin
  foreach target in array array[
    'events',
    'venues',
    'circles',
    'event_images',
    'venue_images',
    'circle_images',
    'event_files',
    'venue_files',
    'circle_files'
  ]
  loop
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = target
        and column_name = 'created_by'
    ) then
      execute format(
        'alter table public.%I add constraint %I foreign key (created_by) references auth.users (id) on delete set null',
        target,
        target || '_created_by_fkey'
      );
    end if;
  end loop;
end $$;

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'login required';
  end if;

  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
