import InfoArticle, { InfoLink } from "@/app/mypage/InfoArticle";

export default function PrivacyPage() {
  return (
    <InfoArticle title="プライバシーポリシー">
      <p>
        studio Chaba（松野佑哉、以下「当方」）は、本サービスにおいて取得するユーザーの個人情報の取り扱いについて、以下のとおりプライバシーポリシーを定めます。お問い合わせは、サイト内の「<InfoLink href="/mypage/contact">お問い合わせ</InfoLink>」フォームより受け付けます。
      </p>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground">1.取得する情報とその利用目的</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>アカウント登録時およびGoogleログイン時に、メールアドレスを取得します。</li>
          <li>
            取得したメールアドレス、プロフィール情報、投稿データ、および「行きたい・保存」等の機能に関するデータは、ログイン認証および本サービスの提供・案内のために利用します。
          </li>
          <li>お問い合わせ時に送信いただいた内容は、返信および確認作業のために利用します。</li>
        </ul>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground">2.データの公開範囲と掲載許可</h2>
        <p>
          イベント・施設・団体として登録・掲載されたコンテンツは、ログインしていない第三者も閲覧可能です。掲載する画像や連絡先等は、必ず権利者の許可を得たものに限ります。
        </p>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground">3.第三者提供および外部サービスの利用</h2>
        <p>
          預かった個人情報を、広告配信や第三者へ販売・提供することはありません。ただし、サービスの安定運用・ログイン・データ保管・メール配信のために、以下の外部サービスを利用しています。
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Supabase（データベース・認証）</li>
          <li>Google（認証）</li>
          <li>Vercel（ホスティング）</li>
          <li>Resend（メール配信）</li>
          <li>Google アナリティクス（利用状況の把握）</li>
        </ul>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground">4.データの確認・編集・削除</h2>
        <p>
          ユーザーご自身の投稿内容は、ログイン後に編集・削除が可能です。その他のデータ訂正や削除のご希望についても、「<InfoLink href="/mypage/contact">お問い合わせ</InfoLink>」よりご連絡いただければ、ご本人確認の上で適切に対応いたします。
        </p>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground">5.改定について</h2>
        <p>
          本サービスは試験運用中のため、機能の変更や正式公開に伴い、本ポリシーの内容を改定することがあります。
        </p>
      </section>
    </InfoArticle>
  );
}
