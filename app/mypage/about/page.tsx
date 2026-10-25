import type { Metadata } from "next";
import InfoArticle, { InfoLink } from "@/app/mypage/InfoArticle";

export const metadata: Metadata = {
  title: "このサイトについて",
};

export default function AboutPage() {
  return (
    <InfoArticle title="このサイトについて">
      <p>
        Shizuoka Art Portal（静岡アートポータル）は、静岡県内のビジュアルアート（展覧会・公募・ワークショップ・クラフト市など）の情報をまとめて探せるポータルサイトです。
      </p>
      <p>
        本サイトは視覚芸術（ビジュアルアート）を中心に対象としております。そのため、音楽・演劇など関連性の薄いイベントにつきましては、掲載をお断りすることや投稿を非表示・削除させていただく場合がございます。あらかじめご了承ください。
      </p>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>
          詳しい使い方：
          <InfoLink href="/mypage/help">ヘルプ</InfoLink>
        </li>
        <li>
          各種お問い合わせ：
          <InfoLink href="/mypage/contact">お問い合わせ</InfoLink>
        </li>
      </ul>
    </InfoArticle>
  );
}
