-- 既存 events への追加命令。本体テーブルは events-venues.sql。
-- カテゴリを固定し、@S 案内情報に近い項目を足す。何度 Run しても同じ結果。

alter table public.events drop constraint if exists events_category_check;

update public.events
set genre = '即売会・マルシェ'
where genre = '即売会・マルシェ・フェス';
update public.events
set genre = 'トーク・パフォーマンス'
where genre in (
  '講演・トーク・パフォーマンス',
  '講演・トーク',
  '講演・パフォーマンス'
);
update public.events
set genre = '公募・レジデンス'
where genre = '公募・レジデンス・募集';

-- 既存の自由入力ジャンルは、新しい選択肢以外なら「その他」へ
update public.events
set genre = 'その他'
where genre is null
   or genre not in (
     '展示',
     '体験・ワークショップ',
     '即売会・マルシェ',
     'トーク・パフォーマンス',
     '交流・オフ会',
     '公募・レジデンス',
     'その他'
   );

alter table public.events
  alter column genre set default 'その他';

alter table public.events
  alter column genre set not null;

alter table public.events
  add constraint events_category_check
  check (
    genre in (
      '展示',
      '体験・ワークショップ',
      '即売会・マルシェ',
      'トーク・パフォーマンス',
      '交流・オフ会',
      '公募・レジデンス',
      'その他'
    )
  );

alter table public.events add column if not exists time_text text;
alter table public.events add column if not exists schedule_note text;
alter table public.events add column if not exists fee_text text;
alter table public.events add column if not exists organizer text;
alter table public.events add column if not exists support_text text;
alter table public.events add column if not exists contact_name text;
alter table public.events add column if not exists contact_phone text;
alter table public.events add column if not exists contact_email text;
alter table public.events add column if not exists website_url text;
alter table public.events add column if not exists parking_text text;

do $$
begin
  if to_regclass('public.circles') is not null then
    alter table public.events
      add column if not exists circle_id uuid references public.circles (id) on delete set null;
    execute 'create index if not exists events_circle_id_idx on public.events (circle_id)';
  end if;
end $$;
