// server.js (ESM)
import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { recommend3 } from "./recommend.js";
import ws from "ws";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// ✅ Supabase 연결
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    realtime: {
      transport: ws,
    },
  }
);


// ===================================================
// 🔥 1. 추천 API (DB 저장 ❌)
// ===================================================
app.post("/recommend", async (req, res) => {
  console.log("RECOMMEND HIT", new Date().toISOString(), req.body);

  try {
    const { start, minutes, userId, bannedRouteIds, count, tags } = req.body ?? {};

    if (
      !start ||
      !Number.isFinite(Number(start.lat)) ||
      !Number.isFinite(Number(start.lng))
    ) {
      return res.status(400).json({ error: "start{lat,lng} 필요" });
    }

    if (!Number.isFinite(Number(minutes)) || Number(minutes) <= 0) {
      return res.status(400).json({ error: "minutes 필요" });
    }

    const routes = await recommend3({
      start: {
        lat: Math.round(Number(start.lat) * 10000) / 10000,
        lng: Math.round(Number(start.lng) * 10000) / 10000,
      },
      minutes: Number(minutes),
      userId: userId ?? "anon",
      count: count ?? 3,
      bannedRouteIds: Array.isArray(bannedRouteIds) ? bannedRouteIds : [],
      tags: Array.isArray(tags) ? tags : [],
    });

    return res.json({
      routes: Array.isArray(routes) ? routes : [],
    });
  } catch (e) {
    console.error("POST /recommend error:", e);
    return res.status(500).json({
      error: e?.message || "recommend failed",
    });
  }
});


// ===================================================
// 🔥 2. 좋아요/아쉬워요 API (여기서만 DB 저장)
// ===================================================
app.post("/feedback", async (req, res) => {
  try {
    const { route, category, liked } = req.body;

    if (!route) {
      return res.status(400).json({ error: "route 필요" });
    }

    // 👎면 저장 안함
    if (!liked) {
      return res.json({ ok: true, message: "skip save" });
    }

    const { error } = await supabase.from("paths").insert({
      route_id: route.routeId,
      user_id: route.userId === "anon" ? null : route.userId,
      minutes: route.minutes,
      distance_m: route.distanceM,
      duration_sec: route.durationSec,
      geometry_json: route.geometry,
      meta: {
        category: category, // 👈 핵심
        title: route.title,
        traits: route.traits,
        explanation: route.explanation,
      },
    });

    if (error) throw error;

    console.log("👍 좋아요 경로 저장 완료");

    return res.json({ ok: true });
  } catch (e) {
    console.error("feedback error:", e);
    return res.status(500).json({ error: e.message });
  }
});


// ===================================================
// POI API
// ===================================================
app.get("/pois", (req, res) => {
  try {
    const poisPath = path.join(__dirname, "data", "pois.manual.json");
    const vetPath = path.join(__dirname, "data", "veterinary.json");
    const restPath = path.join(__dirname, "data", "restaurants.json");

    const pois = JSON.parse(fs.readFileSync(poisPath, "utf-8"));
    const vets = JSON.parse(fs.readFileSync(vetPath, "utf-8"));
    const rests = JSON.parse(fs.readFileSync(restPath, "utf-8"));

    return res.json([...pois, ...vets, ...rests]);
  } catch (e) {
    console.error("GET /pois error:", e);
    return res.status(500).json({
      error: "pois 읽기 실패",
      detail: String(e?.message || e),
    });
  }
});


// ===================================================
// 헬스체크
// ===================================================
app.get("/health", (_, res) => {
  res.json({
    ok: true,
    message: "backend is running",
  });
});

const PORT = Number(process.env.PORT || 8080);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ backend on http://0.0.0.0:${PORT}`);
});