"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "../../../src/utils/supabase/client.js";

export default function AuthCallback() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState("Signing you in…");

  useEffect(() => {
    (async () => {
      const next = searchParams.get("next") || "/org/acme";

      // New PKCE flow
      const code = searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setStatus(`Login failed: ${error.message}`);
          return;
        }
        router.replace(next);
        return;
      }

      // Legacy email link flow (token_hash + type)
      const token_hash = searchParams.get("token_hash");
      const type = searchParams.get("type");
      if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ type, token_hash });
        if (error) {
          setStatus(`Login failed: ${error.message}`);
          return;
        }
        router.replace(next);
        return;
      }

      setStatus(
        "Login failed: missing code in URL. Please request a new magic link."
      );
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, router, searchParams]);

  return (
    <main style={{ maxWidth: 640, margin: "5rem auto", lineHeight: 1.6 }}>
      <h1>Signing you in…</h1>
      <p>{status}</p>
      <p style={{ fontSize: 14, color: "#666" }}>
        If this takes more than a few seconds, go back and try sending a new link.
      </p>
    </main>
  );
}
