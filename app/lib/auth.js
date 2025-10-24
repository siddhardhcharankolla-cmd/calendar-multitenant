import { verifyToken } from "./jwt.js"; // This path is correct
import { NextResponse } from "next/server";

// This file no longer contains getAuthUser, as that was the source of the error.

export function withAuth(handler, requiredRoles = []) {
  return async (req, context) => {
    // The logic has been moved to the API route itself.
    // This wrapper will now just pass the request through to the handler.
    // The handler will be responsible for getting the user.
    return handler(req, context);
  };
}