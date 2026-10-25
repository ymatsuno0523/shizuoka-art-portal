import type { Metadata } from "next";
import InfoArticle, { InfoLink } from "@/app/mypage/InfoArticle";

export const metadata: Metadata = {
  title: "利用規約",
};

export default function TermsPage() {
  return (
    <InfoArticle title="利用規約">
      <p>
        本サービス（Shizuoka Art Portal）は、studio Chaba（松野佑哉、以下「当方」）が静岡県内のアート情報を発信・共有することを目的として運営・管理するポータルサイトです。本サービスをご利用になる方（以下「ユーザー」）は、本規約に同意したものとみなします。
      </p>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground">
          1.免責事項（試験運用およびサービスについて）
        </h2>
        <p>
          本サービスは現在試験運用中のため、予告なく機能や掲載データの変更、中断、または停止を行う場合があります。
        </p>
        <p>
          本サービスの利用、または利用不能によりユーザーに生じた損害やトラブルについて、当方は理由の如何を問わず一切の責任を負いません。
        </p>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground">2.投稿・掲載内容に関する責任</h2>
        <p>
          イベント・施設・団体等の掲載内容に関する責任は、すべて投稿者に帰属します。
        </p>
        <p>
          第三者の情報や画像等を掲載する場合は、必ず事前に権利者の許可を得た上で投稿してください。権利者からの許諾を得ずに投稿したことによるトラブルや損害について、当方は一切の責任を負いません。
        </p>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground">3.禁止事項</h2>
        <p>ユーザーは、以下の内容を含む投稿や行為を行ってはなりません。</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>他者の著作権、肖像権、プライバシーその他の権利を侵害する内容</li>
          <li>虚偽の情報、または誤解を招く内容</li>
          <li>
            ビジュアルアートとの関連が薄い内容（音楽、演劇、ダンス等の単独イベントなど）
          </li>
          <li>公序良俗に反する内容、法令に違反する内容、またはスパム行為</li>
          <li>その他、当方が不適切と判断する内容</li>
        </ol>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground">4.著作権およびコンテンツの利用</h2>
        <p>
          投稿されたテキスト、画像等の著作権その他の権利は、投稿者または元の権利者に帰属します。
        </p>
        <p>
          投稿者は、当方が本サービスの宣伝・告知・運用の目的において、投稿コンテンツを無償で表示・使用することを許諾するものとします。
        </p>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground">5.投稿の変更・削除</h2>
        <p>
          投稿内容に不備や権利侵害がある場合、禁止事項に該当する場合、または当方が不適切と判断した場合は、投稿者への事前の通知なく投稿を非表示または削除することがあります。
        </p>
        <p>
          掲載内容の訂正や削除のご依頼は、「
          <InfoLink href="/mypage/contact">お問い合わせ</InfoLink>
          」よりご連絡ください。
        </p>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground">6.個人情報の取り扱い</h2>
        <p>
          ユーザーの個人情報の取り扱いについては、別途定める「
          <InfoLink href="/mypage/privacy">プライバシーポリシー</InfoLink>
          」に従います。
        </p>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground">7.利用規約の変更</h2>
        <p>
          当方は、必要と判断した場合には、ユーザーへの事前の通知なく本規約を変更することができるものとします。変更後の規約は、本サービス上に掲載した時点から効力を生じるものとします。
        </p>
      </section>
      <p className="text-zinc-500 dark:text-zinc-400">制定日：2026年10月25日</p>
    </InfoArticle>
  );
}
