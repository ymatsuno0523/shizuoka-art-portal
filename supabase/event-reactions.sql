-- イベントの「行きたい」（主催が見られる目安）と「保存」（自分だけ）。
-- 何度 Run しても同じ結果。

create table if not exists public.event_going (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create table if not exists public.event_saves (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create index if not exists event_going_user_id_idx on public.event_going (user_id);
create index if not exists event_saves_user_id_idx on public.event_saves (user_id);

alter table public.event_going enable row level security;
alter table public.event_saves enable row level security;

drop policy if exists "Users read own or hosted going" on public.event_going;
create policy "Users read own or hosted going"
on public.event_going
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.events e
    where e.id = event_id
      and e.created_by = auth.uid()
  )
);

drop policy if exists "Users insert own going" on public.event_going;
create policy "Users insert own going"
on public.event_going
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users delete own going" on public.event_going;
create policy "Users delete own going"
on public.event_going
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users read own saves" on public.event_saves;
create policy "Users read own saves"
on public.event_saves
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users insert own saves" on public.event_saves;
create policy "Users insert own saves"
on public.event_saves
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users delete own saves" on public.event_saves;
create policy "Users delete own saves"
on public.event_saves
for delete
to authenticated
using (user_id = auth.uid());

grant select, insert, delete on public.event_going to authenticated;
grant select, insert, delete on public.event_saves to authenticated;

create or replace function public.event_going_count(p_event_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer from public.event_going where event_id = p_event_id;
$$;

grant execute on function public.event_going_count(uuid) to anon, authenticated;

create table if not exists public.venue_saves (
  venue_id uuid not null references public.venues (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (venue_id, user_id)
);

create table if not exists public.circle_saves (
  circle_id uuid not null references public.circles (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (circle_id, user_id)
);

create index if not exists venue_saves_user_id_idx on public.venue_saves (user_id);
create index if not exists circle_saves_user_id_idx on public.circle_saves (user_id);

alter table public.venue_saves enable row level security;
alter table public.circle_saves enable row level security;

drop policy if exists "Users read own venue saves" on public.venue_saves;
create policy "Users read own venue saves"
on public.venue_saves for select to authenticated
using (user_id = auth.uid());

drop policy if exists "Users insert own venue saves" on public.venue_saves;
create policy "Users insert own venue saves"
on public.venue_saves for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users delete own venue saves" on public.venue_saves;
create policy "Users delete own venue saves"
on public.venue_saves for delete to authenticated
using (user_id = auth.uid());

drop policy if exists "Users read own circle saves" on public.circle_saves;
create policy "Users read own circle saves"
on public.circle_saves for select to authenticated
using (user_id = auth.uid());

drop policy if exists "Users insert own circle saves" on public.circle_saves;
create policy "Users insert own circle saves"
on public.circle_saves for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users delete own circle saves" on public.circle_saves;
create policy "Users delete own circle saves"
on public.circle_saves for delete to authenticated
using (user_id = auth.uid());

grant select, insert, delete on public.venue_saves to authenticated;
grant select, insert, delete on public.circle_saves to authenticated;
