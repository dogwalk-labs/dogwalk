// server.js (ESM)
import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
import { recommend3 } from "./recommend.js";
import ws from "ws";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// ✅ Gemini 연결
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

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
// 🔥 1. 추천 API
// ===================================================
app.post("/recommend", async (req, res) => {
  console.log("RECOMMEND HIT", new Date().toISOString(), req.body);

  try {
    const { start, minutes, userId, bannedRouteIds, count, tags } =
      req.body ?? {};

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
// 🔥 2. 좋아요/아쉬워요 API
// ===================================================
app.post("/feedback", async (req, res) => {
  try {
    const { route, category, liked } = req.body;

    if (!route) {
      return res.status(400).json({ error: "route 필요" });
    }

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
        category,
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
// 챗봇 API
// ===================================================
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body ?? {};

    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: "message 필요" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY가 .env에 없습니다.",
      });
    }

    const prompt = `
너는 반려견 산책 앱 "멍멍워크"의 챗봇이야.

역할:
- 반려견 산책, 건강, 생활 관리, 산책 준비물, 위험 음식 등에 대해 답변해줘.
- 답변은 한국어로 해줘.
- 말투는 친절하고 다정하게 해줘.
- 너무 길게 말하지 말고 3~6문장 정도로 답해줘.
- 위험한 상황이면 "가까운 동물병원에 문의하세요"라고 안내해줘.
- 정확한 진단이나 처방은 하지 마.

사용자 질문:
${message}
`;

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });

    const reply =
      response?.text ||
      response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "답변을 생성하지 못했어요.";

    return res.json({ reply });
  } catch (e) {
    console.error("POST /chat error:", e);
    return res.status(500).json({
      error: "chat failed",
      detail: e?.message || String(e),
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