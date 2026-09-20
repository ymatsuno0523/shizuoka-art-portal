export const SNS_LINKS = [
  { key: "sns_instagram", label: "Instagram" },
  { key: "sns_x", label: "X" },
  { key: "sns_facebook", label: "Facebook" },
  { key: "sns_youtube", label: "YouTube" },
  { key: "sns_tiktok", label: "TikTok" },
  { key: "sns_line", label: "LINE" },
] as const;

export type SnsKey = (typeof SNS_LINKS)[number]["key"];
