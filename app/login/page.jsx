"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@acme.com"); // Prefill for convenience
  const [password, setPassword] = useState("password123"); // Prefill for convenience
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent double-clicks
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true); // Disable button

    console.log("Login: Sending fetch request...");

    try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        console.log("Login: Fetch response status:", response.status);

        if (response.ok) {
          console.log("Login: Fetch successful (status 200/302).");
          // --- FINAL FIX: Delay navigation slightly ---
          // Clear state immediately
          setEmail("");
          setPassword("");
          // Wait a very short moment before trying client-side navigation
          // The server's 302 should ideally handle it, but this is a fallback.
          setTimeout(() => {
              console.log("Login: Attempting client-side redirect after delay...");
              // Use replace to avoid adding login to history
              router.replace("/dashboard");
              // As a final fallback if router fails
              // window.location.replace("/dashboard");
          }, 100); // 100 milliseconds delay
          // --- END FINAL FIX ---
        } else {
          const data = await response.json();
          console.log("Login: Fetch failed. Error:", data.error);
          setError(data.error || "Login failed. Please try again.");
          setIsSubmitting(false); // Re-enable button on error
        }
    } catch (err) {
        console.error("Login: Fetch encountered an error:", err);
        setError("An unexpected error occurred. Please try again.");
        setIsSubmitting(false); // Re-enable button on error
    }
    // Note: setIsSubmitting(false) is not called on success because navigation occurs
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
            disabled={isSubmitting} // Disable while submitting
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
            disabled={isSubmitting} // Disable while submitting
          />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" style={{ marginTop: "1rem" }} disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
      </form>
    </main>
  );
}