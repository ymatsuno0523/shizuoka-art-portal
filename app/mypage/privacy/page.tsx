import InfoArticle, { InfoLink } from "@/app/mypage/InfoArticle";

export default function PrivacyPage() {
  return (
    <InfoArticle title="プライバシーポリシー">
      <p>
        このサービスは、studio Chaba（松野佑哉）が試験運用しています。連絡は{" "}
        <InfoLink href="/mypage/contact">お問い合わせ</InfoLink> から受け付けます。
      </p>
      <p>
        アカウント登録時にメールアドレスを預かります。Googleでログインした場合も、そのアカウントのメールアドレスを使います。プロフィール、投稿、行きたい・保存は、ログインとサービスの提供のために使います。
      </p>
      <p>
        イベント・施設・団体として掲載された内容は、ログインしていなくても閲覧できます。掲載する写真や連絡先は、掲載の許可を得たものに限ります。
      </p>
      <p>
        預かった情報は、サービス運営の範囲で使います。広告配信や第三者への販売には使いません。保管やログイン、お問い合わせの送信のために、Supabase、Google、Vercel、Resendを利用します。
      </p>
      <p>
        自分の投稿は、ログイン後に編集・削除できます。それ以外の訂正や削除の希望も、お問い合わせから受け付け、確認でき次第対応します。試験運用のため、機能やデータの扱いは公開時に見直すことがあります。
      </p>
    </InfoArticle>
  );
}
