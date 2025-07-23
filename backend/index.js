// backend/index.js
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 6000;

app.use(cors());
app.use(express.json());

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

// New route to fetch by direct type
app.get("/api/image/type", async (req, res) => {
  const { type } = req.query;
  if (!type) {
    return res
      .status(400)
      .json({ success: false, message: "Type is required." });
  }

  try {
    const apiRes = await fetch(`https://nekobot.xyz/api/image?type=${type}`);
    const data = await apiRes.json();

    if (data.success) {
      res.json({ success: true, imageUrl: data.message });
    } else {
      throw new Error("Image fetch failed");
    }
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
