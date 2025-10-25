"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@acme.com"); // Prefill
  const [password, setPassword] = useState("password123"); // Prefill
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    console.log("Login: Sending fetch request...");

    try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        console.log("Login: Fetch response status:", response.status);
        console.log("Login: Fetch response redirected:", response.redirected); // Log if fetch followed a redirect
        console.log("Login: Fetch final URL:", response.url); // Log the final URL after potential redirects

        // --- FINAL FIX: Check for successful redirect explicitly ---
        // A successful login results in a redirect (status 200-299 range OR redirected=true)
        // If the server sent 302, response.ok might be true, and response.redirected will be true.
        // If the server sent 200 (less likely now), response.ok is true.
        if (response.ok || response.redirected) {
          console.log("Login: Fetch successful or redirected. Navigating client-side...");
          // Clear state immediately
          setEmail("");
          setPassword("");
          // Use router.push which is gentler than replace for standard navigation
          router.push("/dashboard");
          // No need for setTimeout or window.location if router.push works
        } else {
          // Handle specific error statuses
          let errorMsg = "Login failed. Please try again.";
          try {
              const data = await response.json();
              errorMsg = data.error || errorMsg;
          } catch (jsonError) {
              console.error("Login: Could not parse error JSON:", jsonError);
              errorMsg = `Login failed with status: ${response.status}`;
          }
          console.log("Login: Fetch failed. Error:", errorMsg);
          setError(errorMsg);
          setIsSubmitting(false); // Re-enable button on error
        }
    // --- END FINAL FIX ---

    } catch (err) {
        // Log the actual network or processing error
        console.error("Login: Fetch encountered an unexpected client-side error:", err);
        setError("An unexpected network error occurred. Please try again.");
        setIsSubmitting(false); // Re-enable button on error
    }
    // Note: Do not set isSubmitting false on success path, navigation occurs
  };

  return (
    <main>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label><br />
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isSubmitting}/>
        </div>
        <div style={{ marginTop: "1rem" }}>
          <label htmlFor="password">Password</label><br />
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isSubmitting}/>
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" style={{ marginTop: "1rem" }} disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
      </form>
    </main>
  );
}