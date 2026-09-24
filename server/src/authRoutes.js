import express from "express";
import bcrypt from "bcryptjs";
import { User } from "./models/User.js";
import { createToken, requireAuth } from "./auth.js";
import { sendUserNotification } from "./services/notificationService.js";

export function createAuthRoutes() {
  const router = express.Router();

  router.post("/register", async (req, res) => {
    try {
      const name = String(req.body.name || "").trim();
      const email = String(req.body.email || "").trim().toLowerCase();
      const password = String(req.body.password || "");
      if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
        return res.status(400).json({ error: "Name, valid email, and password of at least 8 characters are required" });
      }
      const passwordHash = await bcrypt.hash(password, 12);
      const user = await User.create({ name, email, passwordHash });
      res.status(201).json({ token: createToken(user), user: publicUser(user) });
    } catch (error) {
      const duplicate = error.code === 11000;
      res.status(duplicate ? 409 : 400).json({ error: duplicate ? "An account with this email already exists" : "Could not create account" });
    }
  });

  router.post("/login", async (req, res) => {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    res.json({ token: createToken(user), user: publicUser(user) });
  });

  router.get("/me", requireAuth, (req, res) => res.json({ user: req.user }));

  router.put("/notifications", requireAuth, async (req, res) => {
    const telegramChatId = String(req.body.telegramChatId || "").trim();
    if (!/^-?\d+$/.test(telegramChatId)) return res.status(400).json({ error: "Enter a valid Telegram Chat ID" });
    const user = await User.findByIdAndUpdate(req.user._id, { telegramChatId }, { new: true }).select("-passwordHash").lean();
    res.json({ user });
  });

  router.post("/notifications/test", requireAuth, async (req, res) => {
    const result = await sendUserNotification(req.user, {
      subject: "NexusFlow notification test",
      emailMessage: `NexusFlow test notification for ${req.user.name}.`,
      telegramMessage: `NexusFlow test notification for <b>${escapeHtml(req.user.name)}</b>.`
    });
    res.json(result);
  });

  return router;
}

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, telegramChatId: user.telegramChatId };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[character]));
}