"use client";
import { useEffect, useState } from "react";
import Header from "../components/Header";
import { useRouter } from "next/navigation";

// The rest of the page remains the same:
function decodeToken(token) { /* ... */ }
// ... (all state definitions and handler functions) ...

export default function DashboardPage() {
  // All state definitions here
  const [myEvents, setMyEvents] = useState([]);
  const [globalEvents, setGlobalEvents] = useState([]);
  const [subscriptions, setSubscriptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const router = useRouter();
  // ... (all filter states) ...

  // The key change: Check if the user is authenticated in the client side
  useEffect(() => {
    // This is a minimal check to force redirection if no cookie is found
    const token = document.cookie.split('; ').find(row => row.startsWith('session_token='))?.split('=')[1];
    if (!token && !user) {
        router.replace('/login');
    } else if (token && !user) {
        // Fetch data if token is present but state is missing
        fetchData();
    }
  }, [user, router]); // Dependency array ensures check runs when user state changes

  // ... (rest of the component functions: fetchData, handleApplyFilters, etc.) ...
  
  // OMITTING full code for brevity, but this requires placing the full component 
  // into the file you have.

  if (!user && !loading) return <main><p>Redirecting...</p></main>;

  return (
    <main>
      {/* ... The rest of the dashboard JSX ... */}
    </main>
  );
}