// server.js (DB 제거, OSRM에서 3개 바로 생성 + bannedRouteIds(추천에서 제외한 routeId목록) 지원)
const express = require("express");
const cors = require("cors");
const { recommend3 } = require("./recommend.js");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ 프론트 호환: POST /recommend
// body: { start: {lat,lng}, minutes: number, userId?: string, bannedRouteIds?: string[] }
app.post("/recommend", async (req, res) => {
  console.log("RECOMMEND HIT", Date.now(), req.body?.minutes);
  console.time("RECOMMEND");

  try {
    const { start, minutes, userId, bannedRouteIds } = req.body ?? {};

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

    const routes = await recommend3({
      start,
      minutes: m,
      userId: uid,
      bannedRouteIds: banned,
    });

    return res.json({ routes });
  } catch (e) {
    return res.status(500).json({ error: String(e?.stack || e) });
  } finally {
    console.timeEnd("RECOMMEND");
  }
});

// ✅ 문서용/데모용: GET /routes/recommend?time=30&lat=..&lng=..&userId=anon
// (banned는 GET에선 생략. 필요하면 나중에 query로 확장)
app.get("/routes/recommend", async (req, res) => {
  console.time("RECOMMEND_GET");
  try {
    const time = Number(req.query.time);
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const userId = String(req.query.userId ?? "anon");

    if (!Number.isFinite(time) || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ error: "query로 time, lat, lng 필요" });
    }

    const routes = await recommend3({
      start: { lat, lng },
      minutes: time,
      userId,
      bannedRouteIds: [],
    });

    return res.json({ routes });
  } catch (e) {
    return res.status(500).json({ error: String(e?.stack || e) });
  } finally {
    console.timeEnd("RECOMMEND_GET");
  }
});

app.get("/health", (_, res) => res.json({ ok: true }));

app.listen(8080, "0.0.0.0", () => {
  console.log("✅ backend on http://0.0.0.0:8080");
  console.log("   POST /recommend  or  GET /routes/recommend?time=30&lat=..&lng=..");
});
