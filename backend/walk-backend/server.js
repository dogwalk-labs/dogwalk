// server.js (ESM)
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { recommend3 } from "./recommend.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

app.post("/recommend", async (req, res) => {
  console.log("RECOMMEND HIT", Date.now(), req.body?.minutes);
  console.time("RECOMMEND");

  try {
    const { start, minutes, userId, bannedRouteIds, count } = req.body ?? {};

    if (!start || !Number.isFinite(Number(start.lat)) || !Number.isFinite(Number(start.lng))) {
      return res.status(400).json({ error: "start{lat,lng} 필요" });
    }
    if (!Number.isFinite(Number(minutes))) {
      return res.status(400).json({ error: "minutes 필요" });
    }

    const m = Number(minutes);
    const uid = userId ?? "anon";

    const banned = Array.isArray(bannedRouteIds)
      ? bannedRouteIds.filter((x) => typeof x === "string" && x.length > 0)
      : [];

    const cRaw = Number(count);
    const c = Number.isFinite(cRaw) ? Math.max(1, Math.min(3, Math.floor(cRaw))) : 3;

    const routes = await recommend3({
      start: {
        lat: Number(start.lat),
        lng: Number(start.lng),
      },
      minutes: m,
      userId: uid,
      count: c,
      bannedRouteIds: banned,
    });

    return res.json({ routes });
  } catch (e) {
    console.error("POST /recommend error:", e);
    return res.status(500).json({ error: String(e?.stack || e) });
  } finally {
    console.timeEnd("RECOMMEND");
  }
});

app.get("/routes/recommend", async (req, res) => {
  console.time("RECOMMEND_GET");

  try {
    const time = Number(req.query.time);
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const userId = String(req.query.userId ?? "anon");

    const cRaw = Number(req.query.count);
    const c = Number.isFinite(cRaw) ? Math.max(1, Math.min(3, Math.floor(cRaw))) : 3;

    if (!Number.isFinite(time) || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ error: "query로 time, lat, lng 필요" });
    }

    const routes = await recommend3({
      start: { lat, lng },
      minutes: time,
      userId,
      count: c,
      bannedRouteIds: [],
    });

    return res.json({ routes });
  } catch (e) {
    console.error("GET /routes/recommend error:", e);
    return res.status(500).json({ error: String(e?.stack || e) });
  } finally {
    console.timeEnd("RECOMMEND_GET");
  }
});

// ✅ POI JSON 내려주는 API
app.get("/pois", (req, res) => {
  try {
    const filePath = path.join(__dirname, "data", "pois.manual.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    const json = JSON.parse(raw);

    return res.json(json);
  } catch (e) {
    console.error("GET /pois error:", e);
    return res.status(500).json({
      error: "pois.manual.json 읽기 실패",
      detail: String(e?.message || e),
    });
  }
});

app.get("/health", (_, res) => res.json({ ok: true }));

app.listen(8080, "0.0.0.0", () => {
  console.log("✅ backend on http://0.0.0.0:8080");
});