import crypto from "crypto";

const OSRM_BASE = process.env.OSRM_BASE_URL || "http://localhost:5000";
const PROFILE = "foot";

const PACE_M_PER_MIN = Number(process.env.PACE_M_PER_MIN || 80);

const fetchFn = global.fetch;

/* ---------------- util ---------------- */

// ⭐ 좌표 반올림 함수 (소수점 4자리 = 약 11m 단위)
function roundCoord(coord) {
  return Math.round(coord * 10000) / 10000;
}

function routeId(geometry) {
  const rounded = geometry.coordinates.map(([lng, lat]) => [
    Math.round(lng * 10000) / 10000,
    Math.round(lat * 10000) / 10000,
  ]);

  return crypto
    .createHash("sha1")
    .update(JSON.stringify(rounded))
    .digest("hex");
}

function waypoint(start, meters, deg) {
  const rad = (deg * Math.PI) / 180;

  const dLat = (meters * Math.cos(rad)) / 111320;

  const dLng =
    (meters * Math.sin(rad)) /
    (111320 * Math.cos((start.lat * Math.PI) / 180));

  return {
    lat: start.lat + dLat,
    lng: start.lng + dLng,
  };
}

// ... (이하 기존 코드 그대로) ...