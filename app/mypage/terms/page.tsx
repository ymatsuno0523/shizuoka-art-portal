import InfoArticle, { InfoLink } from "@/app/mypage/InfoArticle";

export default function TermsPage() {
  return (
    <InfoArticle title="利用規約">
      <p>
        本サービスは、studio Chaba（松野佑哉、以下「当方」）が静岡県内のアート情報を発信・共有することを目的として試験運用しているポータルサイトです。
      </p>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground">1.免責事項（試験運用について）</h2>
        <p>
          本サービスは現在試験運用中のため、機能や掲載データは予告なく変更・停止される場合があります。
        </p>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground">2.投稿・掲載内容に関する責任</h2>
        <p>
          イベント・施設・団体等の掲載内容に関する責任は、投稿者に帰属します。他者の権利（著作権・肖像権等）を侵害する内容、虚偽の情報、または迷惑行為となる投稿はお控えください。第三者の情報や写真を掲載する場合は、必ず事前に権利者の許可を得た上で投稿してください。
        </p>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground">3.著作権およびコンテンツの利用</h2>
        <p>
          投稿された内容は、本サービス上での紹介・発信を目的として表示されます。作品や画像等の著作権・権利は、投稿者または元の権利者に帰属します。
        </p>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground">4.投稿の削除・修正</h2>
        <p>
          不備や権利侵害がある場合、または当方が不適切と判断した場合は、予告なく投稿を非表示または削除することがあります。掲載内容の訂正や削除のご依頼は、「<InfoLink href="/mypage/contact">お問い合わせ</InfoLink>」よりご連絡ください。
        </p>
      </section>
      <section className="space-y-1">
        <h2 className="font-semibold text-foreground">5.個人情報の取り扱い</h2>
        <p>
          ユーザーの個人情報の取り扱いについては、別途定める「<InfoLink href="/mypage/privacy">プライバシーポリシー</InfoLink>」に従います。
        </p>
      </section>
    </InfoArticle>
  );
}
