import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = "this-is-a-super-secret-key-for-development";

function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return { valid: true, decoded };
    } catch (error) {
        // Log error only if needed for debugging middleware issues
        // console.error("Middleware verifyToken Error:", error.message);
        return { valid: false, decoded: null };
    }
}

export async function middleware(request) {
    console.log(`--- Middleware running for: ${request.nextUrl.pathname}`);
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    const { pathname } = request.nextUrl;

    let userRole = null;
    let validSession = false;

    if (sessionToken) {
        const { valid, decoded } = verifyToken(sessionToken);
        if (valid && decoded) {
            userRole = decoded.role;
            validSession = true;
            console.log("Middleware: Valid session found. Role:", userRole);
        } else {
            console.log("Middleware: Invalid session token found.");
            // Clear invalid token
             const response = NextResponse.next(); // Continue but clear cookie
             response.cookies.set("session_token", "", { maxAge: 0, path: "/" });
            // Don't redirect yet, let subsequent rules handle it
        }
    } else {
        console.log("Middleware: No session token found.");
    }

    // --- Login Page Logic ---
    // If user HAS a valid session and tries to access /login, redirect to dashboard
    if (validSession && pathname === "/login") {
        console.log("Middleware: Valid session on /login. Redirecting to /dashboard.");
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // --- Root Path Logic ---
    if (pathname === "/") {
      if (validSession) {
        console.log("Middleware: Valid session on root. Redirecting to /dashboard.");
        return NextResponse.redirect(new URL("/dashboard", request.url));
      } else {
        console.log("Middleware: No valid session on root. Redirecting to /login.");
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }

    // --- Admin Route Specific Logic ---
    const isAdminRoute = pathname.startsWith("/admin");
    // If trying to access admin route WITHOUT a valid session OR without correct role
    if (isAdminRoute && (!validSession || userRole !== 'system_admin')) {
        console.log(`Middleware: Unauthorized attempt to access /admin (ValidSession: ${validSession}, Role: ${userRole}). Redirecting.`);
        // Redirect to login if no session, dashboard if wrong role
        const redirectUrl = validSession ? "/dashboard" : "/login";
        const response = NextResponse.redirect(new URL(redirectUrl, request.url));
        // Clear cookie if redirecting to login due to invalid token
        if (!validSession && sessionToken) {
             response.cookies.set("session_token", "", { maxAge: 0, path: "/" });
        }
        return response;
    }

    // --- Default: Allow request if none of the above redirected ---
    // Includes allowing access to /dashboard even without a token initially;
    // The dashboard page itself will handle fetching user data and redirecting if needed.
    console.log("Middleware: Allowing request to proceed.");
    return NextResponse.next();
}

export const config = {
  // Only run middleware on root, login, and admin routes
  matcher: ["/", "/login", "/admin/:path*"],
};