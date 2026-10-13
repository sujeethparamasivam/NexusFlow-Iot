import jwt from "jsonwebtoken";
import { config } from "./config.js";
import { User } from "./models/User.js";

export function createToken(user) {
  return jwt.sign({ sub: user._id.toString() }, config.jwtSecret, { expiresIn: "7d" });
}

export async function requireAuth(req, res, next) {
  const token = getToken(req.headers.authorization);
  if (!token) return res.status(401).json({ error: "Authentication required" });

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(payload.sub).select("-passwordHash").lean();
    if (!user) return res.status(401).json({ error: "User account not found" });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session" });
  }
}

export async function getUserFromToken(token) {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    return User.findById(payload.sub).select("-passwordHash").lean();
  } catch {
    return null;
  }
}

function getToken(header = "") {
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}