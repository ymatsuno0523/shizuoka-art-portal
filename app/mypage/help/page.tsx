import InfoArticle, { InfoLink } from "@/app/mypage/InfoArticle";

export default function HelpPage() {
  return (
    <InfoArticle title="ヘルプ">
      <p>
        ログインしなくても、イベント・施設・団体は閲覧できます。投稿や行きたい・保存はログインが必要です。登録はメール、またはGoogleアカウントでできます。メール登録の人は、ログイン画面の「パスワードを忘れた」から再設定できます。
      </p>
      <p>
        行きたいはイベントだけです。保存はイベント・施設・団体に使えます。マイページの「行きたい・保存」から外せます。一覧・マップ・カレンダーの絞り込みでも使えます。
      </p>
      <p>
        自分の投稿は「投稿・登録」から編集・削除できます。PDFは最大3件まで添付でき、リンクを押すと新しいタブで開きます。
      </p>
      <p>
        規約は <InfoLink href="/mypage/terms">利用規約</InfoLink>、個人情報は{" "}
        <InfoLink href="/mypage/privacy">プライバシーポリシー</InfoLink> を見てください。不備や掲載の間違いは{" "}
        <InfoLink href="/mypage/contact">お問い合わせ</InfoLink> から連絡できます。
      </p>
    </InfoArticle>
  );
}
