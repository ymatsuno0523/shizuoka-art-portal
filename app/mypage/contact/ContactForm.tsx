"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/app/components/AuthProvider";

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm dark:border-zinc-700";

export default function ContactForm() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user?.email) return;
    setEmail((current) => current || user.email || "");
  }, [user?.email]);
  const [company, setCompany] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message, company }),
    });
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    setSubmitting(false);
    if (!response.ok) {
      setError(result?.error ?? "送信できませんでした。");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        送りました。返信が必要なときは、入力したメールアドレスへ連絡します。
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        掲載の間違いや不備、その他の連絡はここから送れます。
      </p>
      <label className="block text-sm">
        お名前（任意）
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
          className={`${inputClass} mt-1`}
        />
      </label>
      <label className="block text-sm">
        返信用メール
        <input
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          className={`${inputClass} mt-1`}
        />
      </label>
      <label className="block text-sm">
        内容
        <textarea
          required
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={6}
          maxLength={2000}
          className={`${inputClass} mt-1`}
        />
      </label>
      <input
        value={company}
        onChange={(event) => setCompany(event.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="hidden"
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {submitting ? "送信しています..." : "送信"}
      </button>
    </form>
  );
}
