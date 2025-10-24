export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { query } from "../../../lib/db.js";
import { verifyToken } from "../../../lib/jwt.js";
import { cookies } from "next/headers";

// Helper function to get the authenticated user
async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  if (!token) return null;
  const { valid, decoded } = verifyToken(token);
  return valid ? decoded : null;
}

// GET handler - Returns { global_event_id, is_hidden } objects
const getSubscriptionsHandler = async (req, context) => {
    const user = await getAuthenticatedUser();
    if (!user || !user.organization_id) {
        // Return 401 if user isn't logged in or doesn't belong to an org
        return NextResponse.json({ error: "Unauthorized or user not in an org" }, { status: 401 });
    }
    const organization_id = user.organization_id;
    try {
        const result = await query(
            "SELECT global_event_id, is_hidden FROM EventSubscriptions WHERE organization_id = $1",
            [organization_id]
        );
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error("GET /api/org/subscriptions Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
};

// POST handler - Creates a subscription
const createSubscriptionHandler = async (req, context) => {
  const user = await getAuthenticatedUser();
  // Only org_admin can subscribe
  if (!user || user.role !== 'org_admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const organization_id = user.organization_id;
   if (!organization_id) {
        // Should not happen if role is org_admin, but good check
        return NextResponse.json({ error: "User is not associated with an organization" }, { status: 403 });
    }
  try {
    const { global_event_id } = await req.json();
    // Check specifically for null/undefined, 0 is a valid ID
    if (global_event_id == null) {
      return NextResponse.json({ error: "global_event_id is required" }, { status: 400 });
    }
    // Insert with is_hidden defaulting to false
    await query(
        "INSERT INTO EventSubscriptions (organization_id, global_event_id) VALUES ($1, $2)",
        [organization_id, global_event_id]
    );
    return NextResponse.json({ message: "Subscribed successfully" }, { status: 201 });
  } catch (error) {
    // Handle potential duplicate key error
    if (error.code === '23505') {
        return NextResponse.json({ error: "Already subscribed" }, { status: 409 });
    }
    console.error("POST /api/org/subscriptions Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
};

// PUT handler - Updates is_hidden status
const updateSubscriptionHandler = async (req, context) => {
    const user = await getAuthenticatedUser();
    // Only org_admin can hide/show
    if (!user || user.role !== 'org_admin') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const organization_id = user.organization_id;
    if (!organization_id) {
        return NextResponse.json({ error: "User is not associated with an organization" }, { status: 403 });
    }
    try {
        const body = await req.json();
        const global_event_id = body.global_event_id;
        const is_hidden = body.is_hidden;

        console.log("PUT /api/org/subscriptions received:", { global_event_id, is_hidden, organization_id });

        // Validate input
        if (global_event_id == null || typeof is_hidden !== 'boolean') {
            return NextResponse.json({ error: "global_event_id (number) and is_hidden (boolean) are required" }, { status: 400 });
        }

        // Execute the update query
        const result = await query(
            "UPDATE EventSubscriptions SET is_hidden = $1 WHERE organization_id = $2 AND global_event_id = $3",
            [is_hidden, organization_id, global_event_id]
        );

        // Check if any row was actually updated
        if (result.rowCount === 0) {
            console.error("PUT Update failed: No matching subscription found for org:", organization_id, "event:", global_event_id);
            return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
        }

        console.log("PUT Update successful for event:", global_event_id, "Set is_hidden to:", is_hidden);
        return NextResponse.json({ message: "Subscription updated successfully" });
    } catch (error) {
        console.error("PUT /api/org/subscriptions Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
};

// Export all handlers
export const GET = getSubscriptionsHandler;
export const POST = createSubscriptionHandler;
export const PUT = updateSubscriptionHandler;