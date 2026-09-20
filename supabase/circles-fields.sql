-- 団体の種類を広げ、連絡先・HP・SNS を足す。
-- 何度 Run しても同じ結果。テーブル名 circles のまま（画面上は団体）。

alter table public.circles add column if not exists representative text;
alter table public.circles add column if not exists phone text;
alter table public.circles add column if not exists email text;
alter table public.circles add column if not exists website_url text;
alter table public.circles add column if not exists sns_instagram text;
alter table public.circles add column if not exists sns_x text;
alter table public.circles add column if not exists sns_facebook text;
alter table public.circles add column if not exists sns_youtube text;
alter table public.circles add column if not exists sns_tiktok text;
alter table public.circles add column if not exists sns_line text;

update public.circles set kind = '教室・スクール' where kind in ('スクール', '教室');
update public.circles set kind = '企業・スタジオ' where kind = '企業';
update public.circles
set kind = 'その他'
where kind is null
   or kind not in (
     'サークル',
     '教室・スクール',
     '企業・スタジオ',
     'その他'
   );

alter table public.circles
  alter column kind set default 'サークル';

alter table public.circles drop constraint if exists circles_kind_check;
alter table public.circles
  add constraint circles_kind_check
  check (
    kind in (
      'サークル',
      '教室・スクール',
      '企業・スタジオ',
      'その他'
    )
  );
