export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { query } from "../../lib/db.js";
import { verifyToken } from "../../lib/jwt.js";
import { cookies } from "next/headers";

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  if (!token) return null;
  const { valid, decoded } = verifyToken(token);
  return valid ? decoded : null;
}

const getCalendarHandler = async (req, context) => {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role === 'system_admin') {
    return NextResponse.json([]);
  }
  const requiredRoles = ["org_admin", "org_user"];
  if (!requiredRoles.includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { organization_id } = user;
  if (!organization_id) {
    return NextResponse.json({ error: "User is not part of an organization" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const source = searchParams.get("source");
  const country = searchParams.get("country");
  const industry = searchParams.get("industry");
  console.log("API Filters:", { startDate, endDate, source, country, industry });

  let orgEventsQuery = `SELECT id, title, start_date, 'org' as source FROM events WHERE organization_id = $1`;
  let orgParams = [organization_id];
  let orgParamIndex = 2;

  // --- CRITICAL CHECK: Ensure this query correctly includes is_hidden = FALSE ---
  let globalEventsQuery = `
    SELECT ge.id, ge.name as title, ge.event_date as start_date, 'global' as source
    FROM GlobalEvents ge
    JOIN EventSubscriptions es ON ge.id = es.global_event_id
    WHERE es.organization_id = $1 AND es.is_hidden = FALSE
  `;
  let globalParams = [organization_id];
  let globalParamIndex = 2;

  if (startDate) {
    orgEventsQuery += ` AND start_date >= $${orgParamIndex++}`; orgParams.push(startDate);
    globalEventsQuery += ` AND ge.event_date >= $${globalParamIndex++}`; globalParams.push(startDate);
  }
  if (endDate) {
    orgEventsQuery += ` AND start_date <= $${orgParamIndex++}`; orgParams.push(endDate);
    globalEventsQuery += ` AND ge.event_date <= $${globalParamIndex++}`; globalParams.push(endDate);
  }
  if (country) {
    globalEventsQuery += ` AND ge.country ILIKE $${globalParamIndex++}`; globalParams.push(`%${country}%`);
  }
  if (industry) {
    globalEventsQuery += ` AND ge.industry ILIKE $${globalParamIndex++}`; globalParams.push(`%${industry}%`);
  }

  try {
    let events = [];
    if (source === 'org') {
        const orgResults = await query(orgEventsQuery, orgParams); events = orgResults.rows;
    } else if (source === 'global') {
        const globalResults = await query(globalEventsQuery, globalParams); events = globalResults.rows;
    } else {
        const [orgResults, globalResults] = await Promise.all([
             query(orgEventsQuery, orgParams),
             query(globalEventsQuery, globalParams)
        ]);
        events = [...orgResults.rows, ...globalResults.rows];
    }

    events.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

    // --- NEW DEBUG LOG ---
    console.log("API /api/calendar returning events:", JSON.stringify(events, null, 2));
    // --- END DEBUG LOG ---

    return NextResponse.json(events);

  } catch (error) {
    console.error("FATAL CALENDAR ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
};

export const GET = getCalendarHandler;