import jwt from "jsonwebtoken";

// Hardcoded secret (ensure this is exactly correct and saved)
const JWT_SECRET = "this-is-a-super-secret-key-for-development";
console.log("JWT Lib: Initializing with Secret:", JWT_SECRET ? JWT_SECRET.substring(0, 5) + "..." : "null"); // Log on initial load

export function signToken(payload) {
  console.log("JWT Lib: Signing token with payload:", payload); // Log signing
  try {
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
    console.log("JWT Lib: Signing successful. Token starts:", token.substring(0, 10) + "...");
    return token;
  } catch (error) {
    console.error("JWT Lib: Signing FAILED. Error:", error.message);
    throw error; // Re-throw error if signing fails
  }
}

export function verifyToken(token) {
  console.log("JWT Lib: Attempting to verify token:", token ? token.substring(0, 10) + "..." : "null");
  console.log("JWT Lib: Using secret for verification:", JWT_SECRET ? JWT_SECRET.substring(0, 5) + "..." : "null");

  if (!token) {
      console.log("JWT Lib: Verification FAILED. No token provided.");
      return { valid: false, decoded: null };
  }
  if (!JWT_SECRET) {
      console.error("JWT Lib: Verification FAILED. JWT_SECRET is missing!");
      return { valid: false, decoded: null };
  }

  try {
    // THE ACTUAL VERIFICATION
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("JWT Lib: Verification SUCCESSFUL. Decoded:", decoded);
    return { valid: true, decoded };
  } catch (error) {
    // --- THIS IS THE CRITICAL LOG ---
    console.error("JWT Lib: Verification FAILED. Error:", error.message);
    // Log token details if possible without exposing too much
    console.error("JWT Lib: Failing Token (start):", token.substring(0, 10) + "...");
    console.error("JWT Lib: Failing Secret (start):", JWT_SECRET.substring(0, 5) + "...");
    // --- END CRITICAL LOG ---
    return { valid: false, decoded: null };
  }
}