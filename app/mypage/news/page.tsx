import InfoArticle from "@/app/mypage/InfoArticle";

export default function NewsPage() {
  return (
    <InfoArticle title="お知らせ">
      <p>まだお知らせはありません。</p>
      <p className="text-zinc-500">
        運営からの連絡は、ここに掲載する予定です。
      </p>
    </InfoArticle>
  );
}
