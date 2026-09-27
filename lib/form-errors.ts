import { slugSaveHint } from "@/lib/slug";

const COLUMN_LABELS: Record<string, string> = {
  name: "名前",
  title: "タイトル",
  start_at: "開始日",
  end_at: "終了日",
  region: "地域",
  address: "住所",
  kind: "種類",
  genre: "ジャンル",
  slug: "共有用URL",
  email: "メールアドレス",
  password: "パスワード",
  description: "説明",
  created_by: "投稿者",
};

function columnLabel(column: string) {
  return COLUMN_LABELS[column] ?? "必須項目";
}

/** 技術的なDB/APIエラーをユーザー向け日本語に変換する */
export function toUserFormError(
  message: string | null | undefined,
  fallback = "保存に失敗しました。入力内容を確認してもう一度お試しください。",
) {
  const text = message?.trim() ?? "";
  if (!text) return fallback;

  const slugHint = slugSaveHint(text);
  if (slugHint && !/supabase\//i.test(slugHint)) return slugHint;
  if (slugHint && /すでに使われています/.test(slugHint)) return slugHint;

  const nullColumn = text.match(/null value in column "([^"]+)"/i)?.[1];
  if (nullColumn) {
    return `${columnLabel(nullColumn)}は必須です。`;
  }

  if (/violates check constraint/i.test(text)) {
    if (/kind/i.test(text)) return "種類の選択内容を確認してください。";
    if (/genre/i.test(text)) return "ジャンルの選択内容を確認してください。";
    if (/slug/i.test(text)) {
      return "共有用URLは半角英数字とハイフンで入れてください。";
    }
    return "入力内容に問題があります。項目を確認してください。";
  }

  if (/duplicate key|unique constraint/i.test(text)) {
    if (/slug/i.test(text)) return "この共有用URLはすでに使われています。";
    return "同じ内容がすでに登録されています。";
  }

  if (/invalid input syntax|invalid.*uuid/i.test(text)) {
    return "入力形式が正しくありません。";
  }

  if (/permission denied|row-level security|rls|jwt|not authorized/i.test(text)) {
    return "この操作を行う権限がありません。ログイン状態を確認してください。";
  }

  if (/Failed to fetch|NetworkError|network/i.test(text)) {
    return "通信に失敗しました。接続を確認してもう一度お試しください。";
  }

  if (/Invalid login credentials/i.test(text)) {
    return "メールアドレスまたはパスワードが正しくありません。";
  }
  if (/Email not confirmed/i.test(text)) {
    return "メールアドレスの確認が完了していません。確認メールを確認してください。";
  }
  if (/User already registered/i.test(text)) {
    return "このメールアドレスはすでに登録されています。";
  }
  if (/Password should be at least/i.test(text)) {
    return "パスワードは6文字以上にしてください。";
  }
  if (/Unable to validate email|invalid.*email/i.test(text)) {
    return "メールアドレスの形式が正しくありません。";
  }
  if (/For security purposes|only request this after/i.test(text)) {
    return "短時間に何度もリクエストされています。しばらくしてからもう一度お試しください。";
  }

  if (/storage|upload/i.test(text) && /policy|denied|authorized/i.test(text)) {
    return "ファイルのアップロードに失敗しました。";
  }

  // すでに日本語の短いメッセージはそのまま
  if (/[\u3040-\u30ff\u4e00-\u9fff]/.test(text) && text.length <= 80 && !/supabase\//i.test(text)) {
    return text;
  }

  return fallback;
}

export function requiredMessage(label: string) {
  return `${label}は必須です。`;
}
