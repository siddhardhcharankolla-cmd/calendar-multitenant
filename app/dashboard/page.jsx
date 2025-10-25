"use client";
import { useEffect, useState } from "react";
import Header from "../components/Header";
import { useRouter } from "next/navigation";

// Helper function (keep as is)
function decodeToken(token) { /* ... */ }

export default function DashboardPage() {
  const [myEvents, setMyEvents] = useState([]);
  const [globalEvents, setGlobalEvents] = useState([]);
  const [subscriptions, setSubscriptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const router = useRouter();

  // Filter States (keep as is)
  const [startDate, setStartDate] = useState(''); /* ... */
  // ... (endDate, sourceFilter, countryFilter, industryFilter)

  // fetchData function using relative paths
  const fetchData = async (currentFilters = { startDate, endDate, sourceFilter, countryFilter, industryFilter }) => {
    console.log("fetchData started...");
    try {
      setLoading(true); setError(null);
      setMyEvents([]); setGlobalEvents([]); setSubscriptions({}); // Clear on fetch

      console.log("Fetching /api/auth/me...");
      const userRes = await fetch("/api/auth/me"); // Relative path
      console.log("/api/auth/me status:", userRes.status);
      if (!userRes.ok) { setUser(null); throw new Error("User not authenticated"); }
      const userData = await userRes.json();
      console.log("User data received:", userData);
      setUser(userData);
      if (!userData) { throw new Error("User data is missing"); }

      const isSystemAdmin = userData.role === 'system_admin';
      const promises = [];
      const params = new URLSearchParams();

      // ALWAYS Fetch Global Events
      console.log("Adding Global Events fetch...");
      promises.push(fetch("/api/admin/global-events")); // Relative path

      // ONLY Fetch Org Data if NOT system_admin
      if (!isSystemAdmin) {
        // Build calendar params
        if (currentFilters.startDate) params.append('startDate', currentFilters.startDate);
        // ... (add other params)
        const calendarPath = `/api/calendar?${params.toString()}`; // Relative path
        console.log("Adding Calendar fetch:", calendarPath);
        promises.push(fetch(calendarPath));
        console.log("Adding Subscriptions fetch...");
        promises.push(fetch("/api/org/subscriptions")); // Relative path
      } else {
        promises.push(Promise.resolve({ ok: true, json: async () => [] })); // Calendar placeholder
        promises.push(Promise.resolve({ ok: true, json: async () => [] })); // Subscriptions placeholder
      }

      console.log("Fetching data via Promise.all...");
      const [globalEventsRes, myEventsRes, subscriptionsRes] = await Promise.all(promises);
      // ... (check responses, parse JSON, set state - same as before) ...
       if (!globalEventsRes.ok) { throw new Error("Failed to fetch global events"); }
       if (!isSystemAdmin && (!myEventsRes.ok || !subscriptionsRes.ok)) { throw new Error("Failed to fetch necessary org data"); }
       const globalEventsData = await globalEventsRes.json();
       const myEventsData = await myEventsRes.json();
       const subscriptionsData = await subscriptionsRes.json();
       const subsMap = subscriptionsData.reduce((acc, sub) => { if (sub && sub.global_event_id != null) acc[String(sub.global_event_id)] = { is_hidden: sub.is_hidden }; return acc; }, {});
       setMyEvents(Array.isArray(myEventsData) ? myEventsData : []);
       setGlobalEvents(Array.isArray(globalEventsData) ? globalEventsData : []);
       setSubscriptions(subsMap);

    } catch (err) {
      console.error("Fetch Data Error:", err);
       if (err.message !== "User not authenticated") setError(err.message);
       if (err.message === "User not authenticated") { router.push('/login'); }
    } finally {
      console.log("Setting loading to false."); setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Handlers (using relative paths)
  const handleApplyFilters = () => { fetchData({ startDate, endDate, sourceFilter, countryFilter, industryFilter }); };
  const handleSubscribe = async (globalEventId) => { setError(null); try { const response = await fetch("/api/org/subscriptions", { method: "POST", /*...*/ }); if (!response.ok) {/*...*/} fetchData(); } catch (err) { /*...*/ } };
  const handleToggleVisibility = async (globalEventId, newHiddenState) => { setError(null); try { const response = await fetch("/api/org/subscriptions", { method: "PUT", /*...*/ }); if (!response.ok) {/*...*/} fetchData(); } catch (err) { /*...*/ } };

  // --- RENDER LOGIC (Keep as is) ---
  if (loading) return <main><p>Loading...</p></main>;
  if (!user && !loading) return <main><p>Verifying session...</p></main>;
  return ( <main> {/* ... The rest of the dashboard JSX ... */} </main> );
}

// Ensure handlers are fully pasted below
async function handleSubscribe(globalEventId) { /* ... full code using relative path ... */ }
async function handleToggleVisibility(globalEventId, newHiddenState) { /* ... full code using relative path ... */ }