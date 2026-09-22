const MAX_MESSAGE = 2000;

function clean(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "送信内容を読み取れませんでした。" }, { status: 400 });
  }

  const fields = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  if (clean(fields.company, 80)) {
    return Response.json({ ok: true });
  }

  const name = clean(fields.name, 80);
  const email = clean(fields.email, 120);
  const message = clean(fields.message, MAX_MESSAGE);

  if (!isEmail(email)) {
    return Response.json({ error: "返信用のメールアドレスを入力してください。" }, { status: 400 });
  }
  if (!message) {
    return Response.json({ error: "内容を入力してください。" }, { status: 400 });
  }

  const to = process.env.CONTACT_EMAIL?.trim();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!to || !apiKey) {
    return Response.json(
      { error: "お問い合わせはまだ送信できません。運営側のメール設定が済んでから使えます。" },
      { status: 503 },
    );
  }

  const from = process.env.CONTACT_FROM?.trim() || "Shizuoka Art Portal <onboarding@resend.dev>";
  const text = [`名前: ${name || "未入力"}`, `返信用メール: ${email}`, "", message].join("\n");

  const sent = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: email,
      subject: "【静岡アート】お問い合わせ",
      text,
    }),
  });

  if (!sent.ok) {
    return Response.json(
      { error: "送信できませんでした。時間をおいてもう一度試してください。" },
      { status: 502 },
    );
  }

  return Response.json({ ok: true });
}
