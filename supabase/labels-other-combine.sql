-- 「その他」を他の種類と一緒に選べるようにする。最大2つはそのまま。何度 Run しても同じ結果。

alter table public.events drop constraint if exists events_category_check;
alter table public.venues drop constraint if exists venues_kind_check;
alter table public.circles drop constraint if exists circles_kind_check;

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
      '行政・財団',
      'その他'
    ]::text[]
  );
