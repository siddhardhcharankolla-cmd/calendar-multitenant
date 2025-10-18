"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../src/utils/supabase/client.js";

export default function LoginPage() {
  // create a browser client
  const supabase = createClient();
  const router = useRouter();

  // track email input
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  // called when the user clicks "Send Magic Link"
  async function sendLink(e) {
    e.preventDefault();

    // this must match the callback route in your project
    const redirectTo = `${window.location.origin}/auth/callback`;

    setStatus("Sending magic link...");

    // Supabase PKCE magic-link login
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,
      },
    });

    if (error) {
      console.error("Login error:", error);
      setStatus("❌ " + error.message);
      return;
    }

    setStatus("✅ Magic link sent! Check your email and open it in this same browser.");
  }

  return (
    <main style={{ maxWidth: 420, margin: "5rem auto", textAlign: "center" }}>
      <h1>Organization Login</h1>
      <form onSubmit={sendLink}>
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            margin: "12px 0",
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />
        <button
          type="submit"
          style={{
            width: "100%",
            padding: 10,
            background: "#0070f3",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Send Magic Link
        </button>
      </form>

      {status && (
        <p style={{ marginTop: 20, fontSize: 14, color: "#333" }}>
          {status}
        </p>
      )}
    </main>
  );
}
