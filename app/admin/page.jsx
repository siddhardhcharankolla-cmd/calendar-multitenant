"use client";
import { useState, useEffect } from "react";
import Header from "../components/Header";
import { useRouter } from "next/navigation";

// Simple decode function
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
  } catch (e) { console.error("Error decoding token:", e); return null; }
}


export default function AdminPage() {
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [catalog, setCatalog] = useState("National Holidays");
  const [country, setCountry] = useState("");
  const [industry, setIndustry] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState(null);
  const router = useRouter();

  // Check user role on mount
  useEffect(() => {
     const token = document.cookie.split('; ').find(row => row.startsWith('session_token='))?.split('=')[1];
     const decodedUser = token ? decodeToken(token) : null;
     if (!decodedUser || decodedUser.role !== 'system_admin') {
         // Redirect non-admins to dashboard
         router.push('/dashboard');
     } else {
         setUserRole(decodedUser.role);
     }
  }, [router]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!eventName || !eventDate || !catalog) {
      setError("Name, Date, and Catalog are required.");
      return;
    }

    const eventData = {
      name: eventName,
      event_date: eventDate,
      catalog,
      country: country || null,
      industry: industry || null,
      description: description || null,
    };

    try {
      const response = await fetch("/api/admin/global-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        setMessage("Global event created successfully!");
        setEventName(""); setEventDate(""); setCatalog("National Holidays");
        setCountry(""); setIndustry(""); setDescription("");
      } else {
        const data = await response.json();
        setError(data.error || "Failed to create event.");
      }
    } catch (err) {
      setError("An error occurred: " + err.message);
    }
  };

  // Only render form if user is system admin
  if (userRole !== 'system_admin') {
      return <main><p>Access Denied. Redirecting...</p></main>; // Loading or Redirecting state
  }

  return (
    <main>
      <Header />
      <hr style={{ margin: "2rem 0" }} />
      <h1>Admin Panel - Create Global Event</h1>
      <p>Logged in as: admin@system.com (Role: {userRole})</p>

      <form onSubmit={handleSubmit} style={{ maxWidth: '600px', marginTop: '2rem' }}>
        {message && <p style={{ color: "green" }}>{message}</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="eventName">Event Name*:</label><br />
          <input type="text" id="eventName" value={eventName} onChange={(e) => setEventName(e.target.value)} required style={{width: '100%'}}/>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="eventDate">Date*:</label><br />
          <input type="date" id="eventDate" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required style={{width: '100%'}}/>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="catalog">Catalog*:</label><br />
          <select id="catalog" value={catalog} onChange={(e) => setCatalog(e.target.value)} required style={{width: '100%'}}>
            <option value="National Holidays">National Holidays</option>
            <option value="Regional Holidays">Regional Holidays</option>
            <option value="World Special Days">World Special Days</option>
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="country">Country (Optional):</label><br />
          <input type="text" id="country" value={country} onChange={(e) => setCountry(e.target.value)} style={{width: '100%'}}/>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="industry">Industry (Optional):</label><br />
          <input type="text" id="industry" value={industry} onChange={(e) => setIndustry(e.target.value)} style={{width: '100%'}}/>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="description">Description (Optional):</label><br />
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows="3" style={{width: '100%'}}/>
        </div>

        <button type="submit">Create Event</button>
      </form>
    </main>
  );
}