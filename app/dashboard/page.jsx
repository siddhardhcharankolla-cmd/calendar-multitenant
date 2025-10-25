"use client";
import { useEffect, useState } from "react";
import Header from "../components/Header";
import { useRouter } from "next/navigation";

// Helper function to decode JWT
function decodeToken(token) {
  try {
    if (!token) return null;
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Error decoding token:", e);
    return null;
  }
}

export default function DashboardPage() {
  const [myEvents, setMyEvents] = useState([]);
  const [globalEvents, setGlobalEvents] = useState([]);
  const [subscriptions, setSubscriptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const router = useRouter();

  // Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');

  // fetchData function using relative paths with detailed logging
  const fetchData = async (currentFilters = { startDate, endDate, sourceFilter, countryFilter, industryFilter }) => {
    console.log("Dashboard fetchData started..."); // Log start
    try {
      setLoading(true); setError(null);
      // Clear state at the beginning of fetch
      setMyEvents([]);
      setGlobalEvents([]);
      setSubscriptions({});

      console.log("Dashboard: Fetching /api/auth/me...");
      const userRes = await fetch("/api/auth/me"); // Use relative path

      // --- ADDED LOG ---
      console.log("Dashboard: /api/auth/me response status:", userRes.status);
      // --- END ADD ---

      if (!userRes.ok) {
         console.error("Dashboard: Auth fetch failed! Status:", userRes.status);
         // TEMPORARILY COMMENT OUT REDIRECT TO SEE ERROR
         // router.push('/login');
         // return;
         // INSTEAD, THROW ERROR TO DISPLAY IT
         setUser(null); // Clear user state
         throw new Error(`Authentication check failed: Status ${userRes.status}`);
      }

      console.log("Dashboard: Parsing /api/auth/me JSON...");
      const userData = await userRes.json();
      console.log("Dashboard: User data received:", userData);
      setUser(userData);
      if (!userData) { throw new Error("User data is missing"); }

      // --- Conditional Fetching Logic ---
      const isSystemAdmin = userData.role === 'system_admin';
      const promises = [];
      const params = new URLSearchParams();

      // ALWAYS Fetch Global Events
      console.log("Adding Global Events fetch...");
      promises.push(fetch("/api/admin/global-events")); // Relative path

      // ONLY Fetch Org-Specific Data if NOT system_admin
      if (!isSystemAdmin) {
        // Build calendar params
        if (currentFilters.startDate) params.append('startDate', currentFilters.startDate);
        if (currentFilters.endDate) params.append('endDate', currentFilters.endDate);
        if (currentFilters.sourceFilter && currentFilters.sourceFilter !== 'all') params.append('source', currentFilters.sourceFilter);
        if (currentFilters.countryFilter) params.append('country', currentFilters.countryFilter);
        if (currentFilters.industryFilter) params.append('industry', currentFilters.industryFilter);
        const calendarPath = `/api/calendar?${params.toString()}`; // Relative path
        console.log("Adding Calendar fetch:", calendarPath);
        promises.push(fetch(calendarPath));
        console.log("Adding Subscriptions fetch...");
        promises.push(fetch("/api/org/subscriptions")); // Relative path
      } else {
        // Placeholders for system admin
        promises.push(Promise.resolve({ ok: true, json: async () => [] })); // Calendar placeholder
        promises.push(Promise.resolve({ ok: true, json: async () => [] })); // Subscriptions placeholder
      }
      // --- End Conditional Fetching ---

      console.log("Fetching data via Promise.all...");
      const [globalEventsRes, myEventsRes, subscriptionsRes] = await Promise.all(promises);
      console.log("Fetch responses received.");
      console.log("- Global Events status:", globalEventsRes.status);
      console.log("- Calendar status:", myEventsRes.status); // Might be placeholder
      console.log("- Subscriptions status:", subscriptionsRes.status); // Might be placeholder

      // Check essential fetches
      if (!globalEventsRes.ok) { throw new Error("Failed to fetch global events"); }
      // Only check org fetches if they were actually made
      if (!isSystemAdmin && (!myEventsRes.ok || !subscriptionsRes.ok)) {
         throw new Error("Failed to fetch necessary org data");
      }

      console.log("Parsing JSON...");
      const globalEventsData = await globalEventsRes.json();
      console.log("Global Events data parsed.");
      const myEventsData = await myEventsRes.json(); // Will be [] for sys admin
      console.log("Calendar data parsed.");
      const subscriptionsData = await subscriptionsRes.json(); // Will be [] for sys admin
      console.log("Subscriptions data parsed.");

      const subsMap = subscriptionsData.reduce((acc, sub) => { if (sub && sub.global_event_id != null) acc[String(sub.global_event_id)] = { is_hidden: sub.is_hidden }; return acc; }, {});
      console.log("Created Subscriptions Map:", subsMap);

      setMyEvents(Array.isArray(myEventsData) ? myEventsData : []);
      setGlobalEvents(Array.isArray(globalEventsData) ? globalEventsData : []);
      setSubscriptions(subsMap);
      console.log("State updated.");

    } catch (err) {
      console.error("Fetch Data Error:", err);
       // Avoid setting state if component might unmount due to redirect
       if (err.message !== "User not authenticated") {
         setError(err.message);
       }
       // Handle auth error potentially by redirecting (re-enable if needed)
       // if (err.message === "User not authenticated") { router.push('/login'); }
    } finally {
      console.log("Setting loading to false.");
      setLoading(false);
    }
  };


  useEffect(() => { fetchData(); }, []);

  // Handlers
  const handleApplyFilters = () => { fetchData({ startDate, endDate, sourceFilter, countryFilter, industryFilter }); };

  const handleSubscribe = async (globalEventId) => {
     setError(null);
     console.log(`Calling POST /api/org/subscriptions with:`, { global_event_id: globalEventId });
     try {
       const response = await fetch("/api/org/subscriptions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ global_event_id: globalEventId }), });
       if (!response.ok) { const errData = await response.json(); throw new Error(errData.error || "Failed to subscribe"); }
       console.log("Subscribe successful, refreshing data...");
       fetchData(); // Refresh data
     } catch (err) { console.error("Subscribe Error:", err); setError(`Import failed: ${err.message}`); }
  };

  const handleToggleVisibility = async (globalEventId, newHiddenState) => {
      setError(null);
      console.log(`Calling PUT /api/org/subscriptions with:`, { global_event_id: globalEventId, is_hidden: newHiddenState });
      try {
        const response = await fetch("/api/org/subscriptions", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ global_event_id: globalEventId, is_hidden: newHiddenState }), });
        if (!response.ok) { const errData = await response.json(); console.error("Toggle Visibility API Error:", errData); throw new Error(errData.error || `Failed to ${newHiddenState ? 'hide' : 'show'} event`); }
        console.log("Toggle visibility successful, refreshing data...");
        fetchData(); // Refresh data
      } catch (err) { console.error("Toggle Visibility Error:", err); setError(`Update failed: ${err.message}`); }
  };

  // --- RENDER LOGIC ---
  if (loading) {
      return <main><Header /><hr style={{ margin: "2rem 0" }} /><p>Loading dashboard data...</p></main>;
  }
  // If loading finished but user is null (auth failed), show error or redirect state
  if (!user && !loading) {
      return <main><Header /><hr style={{ margin: "2rem 0" }} /><p style={{color: "red"}}>Error: {error || "Authentication failed. Please login again."}</p></main>;
  }

  // User exists, render the dashboard
  return (
    <main>
      <Header />
      <hr style={{ margin: "2rem 0" }} />
      <p>Logged in as: {user.email} (Role: {user.role})</p>

      {/* Filter Section - RENDER ONLY IF NOT system_admin */}
      {user.role !== 'system_admin' && (
        <>
          <h2>Filter Calendar</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
            <div><label htmlFor="startDate">Start Date: </label><input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
            <div><label htmlFor="endDate">End Date: </label><input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
            <div><label htmlFor="sourceFilter">Source: </label><select id="sourceFilter" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}><option value="all">All</option><option value="org">Org Only</option><option value="global">Global Only</option></select></div>
            <div><label htmlFor="countryFilter">Country: </label><input type="text" id="countryFilter" placeholder="e.g., USA" value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)} /></div>
            <div><label htmlFor="industryFilter">Industry: </label><input type="text" id="industryFilter" placeholder="e.g., Tech" value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)} /></div>
            <button onClick={handleApplyFilters}>Apply Filters</button>
          </div>
        </>
      )}

      {/* My Calendar Section - ADJUST MESSAGE FOR system_admin */}
      <h2>My Calendar</h2>
      {error && <p style={{ color: "red" }}>Error loading calendar: {error}</p>}
      {!error && (
         <div>
           {Array.isArray(myEvents) && myEvents.length > 0 ? (
             <ul style={{ listStyle: 'none', padding: 0 }}>
               {myEvents.map((event) => (
                 <li key={`${event?.source}-${event?.id ?? Math.random()}`} style={{ border: '1px solid #eee', padding: '1rem', marginBottom: '1rem', borderRadius: '4px', background: event?.source === 'org' ? '#e0f7fa' : '#fff' }}>
                   {event?.start_date ? new Date(event.start_date).toLocaleDateString() : 'Date missing'} - <strong>{event?.title ?? 'Title Missing'}</strong> ({event?.source ?? 'Source Missing'})
                 </li>
               ))}
             </ul>
           ) : (
              user.role === 'system_admin' ? <p>System Admins do not have an organization calendar.</p> :
              <p>No events found for the selected criteria.</p>
           )}
         </div>
       )}

      {/* Available Global Events Section - RENDER ONLY FOR org_admin */}
      {user?.role === 'org_admin' && (
        <>
          <hr style={{ margin: "2rem 0" }} />
          <h2>Available Global Events</h2>
          {!error && (
            <div>
              {Array.isArray(globalEvents) && globalEvents.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {globalEvents.map((event) => {
                    if (!event || event.id == null) return null;
                    const eventIdStr = String(event.id);
                    const subscription = subscriptions[eventIdStr];
                    const isSubscribed = !!subscription;
                    const isHidden = subscription?.is_hidden ?? false;
                    return (
                      <li key={`global-${event.id}`} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isHidden ? '#f0f0f0' : '#fff' }}>
                        <div>
                          {event?.event_date ? new Date(event.event_date).toLocaleDateString() : 'Date missing'} - <strong>{event?.name ?? 'Name Missing'}</strong> ({event?.catalog ?? 'Catalog Missing'})
                          {event?.country ? <span> - {event.country}</span> : null}
                          {isHidden ? <span style={{ color: 'gray', fontStyle: 'italic', marginLeft: '0.5rem' }}>(Hidden)</span> : null}
                        </div>
                        <div>
                          {isSubscribed ? ( <button onClick={() => handleToggleVisibility(event.id, !isHidden)}> {isHidden ? 'Show' : 'Hide'} </button> ) : ( <button onClick={() => handleSubscribe(event.id)}> Import </button> )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (<p>No global events available.</p>) }
            </div>
          )}
        </>
      )}

       {/* Optional: Show Read-Only Global Events for system_admin */}
       {user?.role === 'system_admin' && (
         <>
           <hr style={{ margin: "2rem 0" }} />
           <h2>Global Event Catalog (Read Only)</h2>
           {!error && (
             <div>
               {Array.isArray(globalEvents) && globalEvents.length > 0 ? (
                 <ul style={{ listStyle: 'none', padding: 0 }}>
                   {globalEvents.map((event) => (
                      <li key={`global-readonly-${event.id}`} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem', borderRadius: '4px'}}>
                         <div>
                            {event?.event_date ? new Date(event.event_date).toLocaleDateString() : 'Date missing'} - <strong>{event?.name ?? 'Name Missing'}</strong> ({event?.catalog ?? 'Catalog Missing'})
                            {event?.country ? <span> - {event.country}</span> : null}
                         </div>
                      </li>
                   ))}
                 </ul>
               ) : (<p>No global events available.</p>) }
             </div>
           )}
         </>
       )}

    </main>
  );
}