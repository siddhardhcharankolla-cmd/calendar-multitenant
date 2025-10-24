import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

// Hardcoded secret (MUST match the one in app/lib/jwt.js)
const JWT_SECRET = "this-is-a-super-secret-key-for-development";

// The function is defined here, NOT imported.
function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return { valid: true, decoded };
    } catch (error) {
        return { valid: false, decoded: null };
    }
}

export async function middleware(request) {
    // Correct async access
    const cookieStore = await cookies(); 
    const sessionToken = cookieStore.get("session_token")?.value;
    const { pathname } = request.nextUrl;

    let userRole = null;
    
    if (sessionToken) {
        const { valid, decoded } = verifyToken(sessionToken);
        if (valid && decoded) {
            userRole = decoded.role;
        }
    }

    // --- Login Page Logic ---
    if (sessionToken && userRole && pathname === "/login") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // --- Protected Routes Logic ---
    const protectedRoutes = ["/dashboard", "/admin"];
    const isAccessingProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    if (isAccessingProtectedRoute && (!sessionToken || !userRole)) {
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.set("session_token", "", { maxAge: 0, path: "/" });
        return response;
    }

    // --- Root Path Logic ---
    if (pathname === "/") {
      if (sessionToken && userRole) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      } else {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }

    // --- Admin Route Specific Logic ---
    if (pathname.startsWith("/admin") && userRole !== 'system_admin') {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/dashboard", "/admin/:path*"],
};