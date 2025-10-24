import jwt from "jsonwebtoken";

// We are bypassing the broken .env.local file system entirely.
// The secret is now directly in the code.
const JWT_SECRET = "this-is-a-super-secret-key-for-development";

export function signToken(payload) {
  // The token will contain user details and expire in 1 day
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
}

export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, decoded };
  } catch (error) {
    return { valid: false, decoded: null };
  }
}