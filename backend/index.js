// backend/index.js
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import mongoose from "mongoose";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 6000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Simple User Activity Schema - just basic tracking
const userActivitySchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  userAgent: String,
  country: String, // From IP geolocation (optional)
  totalFetches: { type: Number, default: 0 },
  totalDownloads: { type: Number, default: 0 },
  totalShares: { type: Number, default: 0 },
  favoriteMode: { type: String, default: "safe" }, // safe or adult
  favoriteMood: String,
  firstVisit: { type: Date, default: Date.now },
  lastVisit: { type: Date, default: Date.now },
});

const UserActivity = mongoose.model("UserActivity", userActivitySchema);

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const moodTypeMap = {
  happy: {
    safe: ["neko", "coffee", "food", "holo"],
    adult: ["boobs", "pussy", "paizuri"],
  },
  curious: {
    safe: ["kemonomimi", "neko", "holo"],
    adult: ["hentai", "tentacle", "anal"],
  },
  lonely: {
    safe: ["holo", "neko"],
    adult: ["ass", "thigh", "pussy"],
  },
  naughty: {
    safe: ["neko", "kemonomimi"],
    adult: ["hentai", "boobs", "pussy", "paizuri"],
  },
};

// Simple middleware to update user activity
const updateUserActivity = async (
  sessionId,
  action,
  mood = null,
  mode = null
) => {
  try {
    const update = {
      lastVisit: new Date(),
      ...(mood && { favoriteMood: mood }),
      ...(mode && { favoriteMode: mode }),
    };

    if (action === "fetch") update.$inc = { totalFetches: 1 };
    if (action === "download") update.$inc = { totalDownloads: 1 };
    if (action === "share") update.$inc = { totalShares: 1 };

    await UserActivity.findOneAndUpdate({ sessionId }, update, {
      upsert: true,
      new: true,
    });
  } catch (error) {
    console.error("Activity update error:", error);
  }
};

// Route to fetch image by type
app.get("/api/image/type", async (req, res) => {
  const { type, mood, mode } = req.query;
  const sessionId = req.headers["x-session-id"];

  if (!type) {
    return res
      .status(400)
      .json({ success: false, message: "Type is required." });
  }

  try {
    const apiRes = await fetch(`https://nekobot.xyz/api/image?type=${type}`);
    const data = await apiRes.json();

    if (data.success) {
      // Update user activity in background
      if (sessionId) {
        updateUserActivity(sessionId, "fetch", mood, mode);
      }

      res.json({
        success: true,
        imageUrl: data.message,
      });
    } else {
      throw new Error("Image fetch failed");
    }
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
});

// Route to trigger download (client-side download)
app.post("/api/image/download", async (req, res) => {
  const { imageUrl, type, mood } = req.body;
  const sessionId = req.headers["x-session-id"];

  if (!imageUrl) {
    return res
      .status(400)
      .json({ success: false, message: "Image URL is required" });
  }

  try {
    // Just return the URL for client-side download
    // Update activity in background
    if (sessionId) {
      updateUserActivity(sessionId, "download", mood);
    }

    res.json({
      success: true,
      imageUrl,
      filename: `${type}-${mood}-${Date.now()}.jpg`,
    });
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ success: false, message: "Download failed" });
  }
});

// Route to share image via email
app.post("/api/image/email", async (req, res) => {
  const { imageUrl, recipientEmail, senderName, message, type, mood } =
    req.body;
  const sessionId = req.headers["x-session-id"];

  if (!imageUrl || !recipientEmail) {
    return res.status(400).json({
      success: false,
      message: "Image URL and recipient email are required",
    });
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: `${senderName || "Someone"} shared an image with you!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #6366f1; text-align: center;">You've received a mood image! 🎨</h2>
          <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p><strong>Type:</strong> ${type}</p>
            <p><strong>Mood:</strong> ${mood}</p>
            ${
              message
                ? `<p><strong>Personal Message:</strong> ${message}</p>`
                : ""
            }
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <img src="${imageUrl}" alt="${type} image" style="max-width: 100%; height: auto; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
          </div>
          <p style="color: #666; font-size: 12px; text-align: center; border-top: 1px solid #eee; padding-top: 10px;">
            Sent via Mood Image Fetcher ✨
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    // Update activity in background
    if (sessionId) {
      updateUserActivity(sessionId, "share", mood);
    }

    res.json({ success: true, message: "Email sent successfully!" });
  } catch (error) {
    console.error("Email error:", error);
    res.status(500).json({ success: false, message: "Failed to send email" });
  }
});

// Route to get basic user stats
app.get("/api/user/stats", async (req, res) => {
  const sessionId = req.headers["x-session-id"];

  if (!sessionId) {
    return res.json({ success: false, message: "Session ID required" });
  }

  try {
    const userActivity = await UserActivity.findOne({ sessionId });

    if (!userActivity) {
      return res.json({
        success: true,
        stats: {
          totalFetches: 0,
          totalDownloads: 0,
          totalShares: 0,
          favoriteMode: "safe",
          favoriteMood: null,
          isNewUser: true,
        },
      });
    }

    const stats = {
      totalFetches: userActivity.totalFetches,
      totalDownloads: userActivity.totalDownloads,
      totalShares: userActivity.totalShares,
      favoriteMode: userActivity.favoriteMode,
      favoriteMood: userActivity.favoriteMood,
      memberSince: userActivity.firstVisit,
      isNewUser: false,
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error("Stats fetch error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
});

// Simple analytics endpoint (for admin)
app.get("/api/admin/analytics", async (req, res) => {
  try {
    const totalUsers = await UserActivity.countDocuments();
    const totalFetches = await UserActivity.aggregate([
      { $group: { _id: null, total: { $sum: "$totalFetches" } } },
    ]);
    const totalDownloads = await UserActivity.aggregate([
      { $group: { _id: null, total: { $sum: "$totalDownloads" } } },
    ]);
    const totalShares = await UserActivity.aggregate([
      { $group: { _id: null, total: { $sum: "$totalShares" } } },
    ]);

    const moodStats = await UserActivity.aggregate([
      { $match: { favoriteMood: { $ne: null } } },
      { $group: { _id: "$favoriteMood", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      analytics: {
        totalUsers,
        totalFetches: totalFetches[0]?.total || 0,
        totalDownloads: totalDownloads[0]?.total || 0,
        totalShares: totalShares[0]?.total || 0,
        popularMoods: moodStats,
      },
    });
  } catch (error) {
    console.error("Analytics fetch error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch analytics" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
