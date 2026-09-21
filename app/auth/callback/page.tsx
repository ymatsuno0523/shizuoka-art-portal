import { Suspense } from "react";
import AuthCallbackClient from "./AuthCallbackClient";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="px-4 py-6">
          <p className="text-sm text-zinc-500">ログインしています...</p>
        </main>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
