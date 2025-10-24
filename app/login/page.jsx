"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  // Prefill for convenience and debugging
  const [email, setEmail] = useState("admin@acme.com"); 
  const [password, setPassword] = useState("password123"); 
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      // --- FINAL FIX: Simply refresh the router ---
      // The server (POST /api/auth/login) already issued the 302 redirect.
      // This command forces Next.js to respect that redirect.
      router.refresh(); 
      // If refresh fails (due to cache), the existing 302 will re-engage.
    } else {
      const data = await response.json();
      setError(data.error || "Login failed. Please try again.");
    }
  };

  return (
    <main>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <br />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div style={{ marginTop: "1rem" }}>
          <label htmlFor="password">Password</label>
          <br />
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" style={{ marginTop: "1rem" }}>
          Login
        </button>
      </form>
    </main>
  );
}