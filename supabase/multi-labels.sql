-- ジャンル・種類を複数選択（text[]、最大2）にする。
-- 団体の「企業・スタジオ」は「企業・事務所」へ。何度 Run しても同じ結果。

alter table public.events drop constraint if exists events_category_check;
alter table public.venues drop constraint if exists venues_kind_check;
alter table public.circles drop constraint if exists circles_kind_check;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'events'
      and column_name = 'genre'
      and data_type = 'text'
  ) then
    alter table public.events
      alter column genre drop default;
    alter table public.events
      alter column genre drop not null;
    alter table public.events
      alter column genre type text[]
      using case
        when genre is null or btrim(genre) = '' then array['その他']::text[]
        else array[genre]::text[]
      end;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'venues'
      and column_name = 'kind'
      and data_type = 'text'
  ) then
    alter table public.venues
      alter column kind drop default;
    alter table public.venues
      alter column kind drop not null;
    alter table public.venues
      alter column kind type text[]
      using case
        when kind is null or btrim(kind) = '' then array['ギャラリー']::text[]
        else array[kind]::text[]
      end;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'circles'
      and column_name = 'kind'
      and data_type = 'text'
  ) then
    update public.circles set kind = '教室・スクール' where kind in ('スクール', '教室');
    update public.circles set kind = '企業・事務所' where kind in ('企業', '企業・スタジオ');
    alter table public.circles
      alter column kind drop default;
    alter table public.circles
      alter column kind drop not null;
    alter table public.circles
      alter column kind type text[]
      using case
        when kind is null or btrim(kind) = '' then array['サークル']::text[]
        else array[kind]::text[]
      end;
  end if;
end $$;

update public.events
set genre = coalesce(
  (
    select array_agg(distinct mapped)
    from (
      select
        case
          when x = '即売会・マルシェ・フェス' then '即売会・マルシェ'
          when x in ('講演・トーク・パフォーマンス', '講演・トーク', '講演・パフォーマンス') then 'トーク・パフォーマンス'
          when x = '公募・レジデンス・募集' then '公募・レジデンス'
          when x in (
            '展示',
            '体験・ワークショップ',
            '即売会・マルシェ',
            'トーク・パフォーマンス',
            '交流・オフ会',
            '公募・レジデンス',
            'その他'
          ) then x
          else null
        end as mapped
      from unnest(coalesce(genre, array[]::text[])) as x
    ) s
    where mapped is not null
  ),
  array['その他']::text[]
);

update public.venues
set kind = coalesce(
  (
    select array_agg(distinct mapped)
    from (
      select
        case
          when x in (
            'ギャラリー',
            'レンタルギャラリー',
            '美術館・博物館',
            '画材・文具',
            'スタジオ・工房',
            '公共施設',
            'その他'
          ) then x
          else null
        end as mapped
      from unnest(coalesce(kind, array[]::text[])) as x
    ) s
    where mapped is not null
  ),
  array['その他']::text[]
);

update public.circles
set kind = coalesce(
  (
    select array_agg(distinct mapped)
    from (
      select
        case
          when x in ('スクール', '教室') then '教室・スクール'
          when x in ('企業', '企業・スタジオ') then '企業・事務所'
          when x in ('サークル', '教室・スクール', '企業・事務所', 'その他') then x
          else null
        end as mapped
      from unnest(coalesce(kind, array[]::text[])) as x
    ) s
    where mapped is not null
  ),
  array['サークル']::text[]
);

update public.events set genre = array['その他'] where genre is null or cardinality(genre) = 0;
update public.venues set kind = array['ギャラリー'] where kind is null or cardinality(kind) = 0;
update public.circles set kind = array['サークル'] where kind is null or cardinality(kind) = 0;

update public.events set genre = genre[1:2] where cardinality(genre) > 2;
update public.venues set kind = kind[1:2] where cardinality(kind) > 2;
update public.circles set kind = kind[1:2] where cardinality(kind) > 2;

alter table public.events alter column genre set default array['その他']::text[];
alter table public.events alter column genre set not null;
alter table public.venues alter column kind set default array['ギャラリー']::text[];
alter table public.venues alter column kind set not null;
alter table public.circles alter column kind set default array['サークル']::text[];
alter table public.circles alter column kind set not null;

alter table public.events
  add constraint events_category_check
  check (
    cardinality(genre) between 1 and 2
    and genre <@ array[
      '展示',
      '体験・ワークショップ',
      '即売会・マルシェ',
      'トーク・パフォーマンス',
      '交流・オフ会',
      '公募・レジデンス',
      'その他'
    ]::text[]
  );

alter table public.venues
  add constraint venues_kind_check
  check (
    cardinality(kind) between 1 and 2
    and kind <@ array[
      'ギャラリー',
      'レンタルギャラリー',
      '美術館・博物館',
      '画材・文具',
      'スタジオ・工房',
      '公共施設',
      'その他'
    ]::text[]
  );

alter table public.circles
  add constraint circles_kind_check
  check (
    cardinality(kind) between 1 and 2
    and kind <@ array[
      'サークル',
      '教室・スクール',
      '企業・事務所',
      'その他'
    ]::text[]
  );
