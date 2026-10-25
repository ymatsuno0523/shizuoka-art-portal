import type { Metadata } from "next";
import InfoArticle, { InfoLink } from "@/app/mypage/InfoArticle";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
};

export default function PrivacyPage() {
  return (
    <InfoArticle title="プライバシーポリシー">
      <p>
        studio Chaba（松野佑哉、以下「当方」）は、本サービス（Shizuoka Art
        Portal）において取得するユーザーの個人情報の取り扱いについて、以下のとおりプライバシーポリシーを定めます。
      </p>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground">1.取得する情報とその利用目的</h2>
        <p>当方は、本サービスの提供にあたり以下の情報を取得・利用します。</p>
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>
            アカウント登録時およびGoogleログイン時に取得するメールアドレスおよびプロフィール情報（ログイン認証、アカウント管理のため）
          </li>
          <li>
            投稿データ、および「行きたい・保存」等の機能に関する利用データ（本サービスの機能提供および案内のため）
          </li>
          <li>
            お問い合わせ時に送信いただいた内容（お問い合わせへの返信および確認作業のため）
          </li>
        </ol>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground">2.データの公開範囲と掲載許可</h2>
        <p>
          イベント・施設・団体として登録・掲載されたコンテンツは、ログインしていない第三者を含むインターネット上に公開されます。掲載する画像や連絡先等の情報については、必ず投稿者自身が事前に権利者の許可を得た上でご登録ください。
        </p>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground">
          3.第三者提供および外部サービスの利用
        </h2>
        <p>
          当方は、法令に基づく場合等を除き、取得した個人情報をユーザーの同意なく第三者に提供・販売することはありません。
        </p>
        <p>
          なお、本サービスの安定運用・ログイン認証・データ保管・メール配信・アクセス解析のために、以下の外部サービスを利用しています。
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Supabase（データベース・認証）</li>
          <li>Google（認証）</li>
          <li>Vercel（ホスティング）</li>
          <li>Resend（メール配信）</li>
          <li>Google アナリティクス（アクセス解析・利用状況の把握）</li>
        </ul>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground">4.データの確認・編集・削除</h2>
        <p>
          ユーザーご自身の投稿内容は、ログイン後にマイページ等から確認・編集・削除が可能です。
        </p>
        <p>
          その他の登録データの訂正やアカウントの削除・データ消去のご希望についても、本サービス内の「
          <InfoLink href="/mypage/contact">お問い合わせ</InfoLink>
          」よりご連絡いただければ、ご本人確認の上で速やかに対応いたします。
        </p>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground">5.ポリシーの改定について</h2>
        <p>
          本サービスは試験運用中のため、機能の追加・変更や正式公開に伴い、本ポリシーの内容を改定することがあります。改定後のプライバシーポリシーは、本サービス上に掲載した時点から効力を生じるものとします。
        </p>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground">お問い合わせ窓口</h2>
        <p>
          本ポリシーに関するお問い合わせは、サイト内の「
          <InfoLink href="/mypage/contact">お問い合わせ</InfoLink>
          」フォームより受け付けます。
        </p>
      </section>
      <p className="text-zinc-500 dark:text-zinc-400">制定日：2026年10月25日</p>
    </InfoArticle>
  );
}
