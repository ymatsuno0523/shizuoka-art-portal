-- 施設（venues）の種類。テーブル名は venues のまま。画面上は施設。
-- 何度 Run しても同じ結果。

alter table public.venues add column if not exists kind text;

update public.venues
set kind = 'ギャラリー'
where kind is null
   or kind not in (
     'ギャラリー',
     'レンタルギャラリー',
     '美術館・博物館',
     '画材・文具',
     'スタジオ・工房',
     '公共施設',
     'その他'
   );

alter table public.venues
  alter column kind set default 'ギャラリー';

alter table public.venues
  alter column kind set not null;

alter table public.venues drop constraint if exists venues_kind_check;
alter table public.venues
  add constraint venues_kind_check
  check (
    kind in (
      'ギャラリー',
      'レンタルギャラリー',
      '美術館・博物館',
      '画材・文具',
      'スタジオ・工房',
      '公共施設',
      'その他'
    )
  );
