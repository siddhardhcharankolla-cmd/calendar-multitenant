"use client";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.refresh(); // Refresh should trigger middleware to redirect
    router.push('/login'); // Force redirect just in case
  };

  return (
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <h1>Dashboard</h1>
      {/* We can add user email here later if needed by passing props */}
      <button onClick={handleLogout} style={{ marginLeft: "1rem" }}>
        Logout
      </button>
    </header>
  );
}