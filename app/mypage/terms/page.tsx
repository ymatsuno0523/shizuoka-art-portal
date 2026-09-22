import InfoArticle, { InfoLink } from "@/app/mypage/InfoArticle";

export default function TermsPage() {
  return (
    <InfoArticle title="利用規約">
      <p>
        このサービスは、studio Chaba（松野佑哉）が静岡県内のアート情報をまとめるために試験運用しています。正式公開前のため、機能や掲載データは予告なく変わることがあります。
      </p>
      <p>
        イベント・施設・団体の掲載内容の責任は投稿者にあります。他人の権利を侵害する内容、虚偽の案内、迷惑行為はおやめください。他の人や店の情報・写真を載せるときは、その許可を得てから投稿してください。
      </p>
      <p>
        投稿された内容は、このサービス上で紹介するために表示します。作品や写真の権利は、投稿者または権利者に残ります。
      </p>
      <p>
        運営は、不備や権利侵害があるとき、投稿を非表示または削除できます。間違いの訂正や削除の希望は{" "}
        <InfoLink href="/mypage/contact">お問い合わせ</InfoLink>{" "}
        から連絡できます。個人情報の扱いは{" "}
        <InfoLink href="/mypage/privacy">プライバシーポリシー</InfoLink>{" "}
        に書いています。
      </p>
    </InfoArticle>
  );
}
