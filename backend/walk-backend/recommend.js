// recommend.js (ESM 완전체 - Trip API 순환 경로 버전)
import crypto from "crypto";

const OSRM_BASE = process.env.OSRM_BASE_URL || "http://localhost:5000";
const OSRM_PROFILE = process.env.OSRM_PROFILE || "foot";

const PACE_M_PER_MIN = 80; // 1분당 80m
const fetchFn = global.fetch;
if (!fetchFn) {
  throw new Error("fetch is not available. Use Node 18+ (recommended Node 18/20/22).");
}

/* ------------------------------
   🔥 geometry 기반 고정 routeId
--------------------------------*/
function makeDeterministicRouteId(geometry) {
  const coordsStr = JSON.stringify(geometry?.coordinates ?? []);
  return crypto.createHash("sha1").update(coordsStr).digest("hex");
}

/* ------------------------------
   waypoint 생성
--------------------------------*/
function makeWaypoint(start, meters, deg) {
  const rad = (deg * Math.PI) / 180;
  const dLat = (meters * Math.cos(rad)) / 111320;
  const dLng =
    (meters * Math.sin(rad)) / (111320 * Math.cos((start.lat * Math.PI) / 180));
  return { lat: start.lat + dLat, lng: start.lng + dLng };
}

/* ------------------------------
   geometry downsample
--------------------------------*/
function downsampleGeoJSON(geo, maxPoints = 500) {
  const coords = geo?.coordinates;
  if (!Array.isArray(coords) || coords.length <= maxPoints) return geo;

  const step = Math.ceil(coords.length / maxPoints);
  const sampled = [];
  for (let i = 0; i < coords.length; i += step) sampled.push(coords[i]);

  const last = coords[coords.length - 1];
  const tail = sampled[sampled.length - 1];
  if (!tail || tail[0] !== last[0] || tail[1] !== last[1]) sampled.push(last);

  return { ...geo, coordinates: sampled };
}

/* ------------------------------
   ✅ Trip API 기반 순환 경로
   /trip API: OSRM이 TSP로 자동 순환 경로 생성
   - 출발점 고정 (source=first, destination=last, roundtrip=true)
   - 같은 길 되돌아오는 현상 방지
   - waypoint 3개로 삼각형 형태 유도 (120도 간격)
--------------------------------*/
async function fetchRoundTrip(start, deg, radiusM, timeoutMs = 8000) {
  // ✅ 삼각형 대신 오각형 루프
  const points = [];

  const loopCount = 5; // 5각형. 더 원형 느낌 원하면 6도 가능

  for (let i = 0; i < loopCount; i++) {
    const angle = (deg + i * (360 / loopCount)) % 360;
    points.push(makeWaypoint(start, radiusM, angle));
  }

  const coords = [
    `${start.lng},${start.lat}`,
    ...points.map((p) => `${p.lng},${p.lat}`),
  ].join(";");

  const url =
    `${OSRM_BASE}/trip/v1/${OSRM_PROFILE}/${coords}` +
    `?overview=full&geometries=geojson&steps=false&source=first&roundtrip=true`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetchFn(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`OSRM trip error ${res.status}`);

    const json = await res.json();
    if (json.code !== "Ok") throw new Error(`OSRM trip: ${json.code}`);

    const trip = json?.trips?.[0];
    if (!trip) throw new Error("OSRM: no trip");

    return trip;
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------
   분석 로직
--------------------------------*/
function wrapAngleDiff(before, after) {
  return Math.abs(((after - before + 540) % 360) - 180);
}

function bearingDeg(a, b) {
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const y =
    Math.sin(((lng2 - lng1) * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) *
      Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(((lng2 - lng1) * Math.PI) / 180);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

function analyzeRouteOsrm(route) {
  const totalDistanceM = Number(route.distance ?? 0);
  const distanceKm = Math.max(0.001, totalDistanceM / 1000);

  const coords = route?.geometry?.coordinates ?? [];
  let turnCount = 0;
  let sharpTurnCount = 0;

  const stride = 6;
  let prevBearing = null;

  for (let i = 0; i + stride < coords.length; i += stride) {
    const a = coords[i];
    const b = coords[i + stride];
    if (!a || !b) continue;

    const br = bearingDeg(a, b);
    if (prevBearing != null) {
      const diff = wrapAngleDiff(prevBearing, br);
      if (diff >= 25) turnCount++;
      if (diff >= 60) sharpTurnCount++;
    }
    prevBearing = br;
  }

  const turnsPerKm = turnCount / distanceKm;
  const sharpTurnRatio = turnCount ? sharpTurnCount / turnCount : 0;

  const tags = [];
  let streetTag = "혼합형";
  if (turnsPerKm > 12) streetTag = "골목 많음";
  else if (turnsPerKm < 6) streetTag = "큰길 위주";
  tags.push(streetTag);

  if (sharpTurnRatio > 0.25) tags.push("방향전환 큼");
  else tags.push("동선 단순");

  return {
    tags,
    explanation: "출발지로 돌아오는 루트입니다.",
  };
}

/* ------------------------------
   각도 배열 생성
--------------------------------*/
function makeDegs(stepDeg) {
  const out = [];
  for (let deg = 0; deg < 360; deg += stepDeg) out.push(deg);
  return out;
}

/* ===================================================
   🔥 최종 recommend3
   - /trip API 기반 순환 경로 (왕복 겹침 완전 해결)
   - waypoint 3개 삼각형 구조 (120도 간격)
   - count 옵션 (1~3)
   - deterministic routeId
   - bannedRouteIds 지원
   - 비슷한 방향 중복 제거 (45도 이내)
=================================================== */
async function recommend3({
  start,
  minutes,
  userId = "anon",
  count = 3,
  bannedRouteIds = [],
}) {
  const cRaw = Number(count);
  const c = Number.isFinite(cRaw) ? Math.max(1, Math.min(3, Math.floor(cRaw))) : 3;

  const banned = new Set(
    Array.isArray(bannedRouteIds)
      ? bannedRouteIds.filter((x) => typeof x === "string" && x.length > 0)
      : []
  );

  const targetSec = minutes * 60;
  const targetM = minutes * PACE_M_PER_MIN;

  // ✅ 원형 루프 반경
  const loopRadiusM = Math.max(250, Math.min(targetM / 5, 900));

  const stepPlan = [60, 30, 20];
  const results = [];
  const tried = new Set();

  for (const stepDeg of stepPlan) {
    const degs = makeDegs(stepDeg).filter((d) => !tried.has(d));
    degs.forEach((d) => tried.add(d));

    await Promise.allSettled(
      degs.map(async (deg) => {
        try {
          const route = await fetchRoundTrip(start, deg, loopRadiusM);

          const distanceM = Number(route.distance ?? 0);
          const osrmSec = Number(route.duration ?? 0);
          const paceSec = (distanceM / PACE_M_PER_MIN) * 60;
          const durationSec = osrmSec > 0 ? osrmSec : paceSec;

          const timeDiff = Math.abs(durationSec - targetSec);
          const distDiff = Math.abs(distanceM - targetM);
          const score = timeDiff * 1.2 + distDiff * 0.08;

          const traits = analyzeRouteOsrm(route);
          const geometry = downsampleGeoJSON(route.geometry, 500);

          const routeId = makeDeterministicRouteId(geometry);
          if (banned.has(routeId)) return;

          // 비슷한 방향(45도 이내) 중복 제거
          const tooSimilar = results.some(
            (r) => Math.abs(((r.deg - deg + 540) % 360) - 180) < 45
          );
          if (tooSimilar) return;

          results.push({
            deg,
            score,
            durationSec,
            distanceM,
            geometry,
            traits,
            routeId,
          });
        } catch {
          // ignore
        }
      })
    );

    const pool = results
      .filter(
        (r) =>
          r.durationSec >= targetSec * 0.7 &&
          r.durationSec <= targetSec * 1.35
      )
      .sort((a, b) => a.score - b.score);

    if (pool.length >= c) {
      return pool.slice(0, c).map((r, idx) => ({
        routeId: r.routeId,
        userId,
        minutes,
        deg: r.deg,
        loopRadiusM,
        title: `${minutes}분 산책 추천 ${idx + 1}`,
        durationSec: Math.round(r.durationSec),
        distanceM: Math.round(r.distanceM),
        geometry: r.geometry,
        traits: r.traits,
        explanation: r.traits.explanation,
      }));
    }
  }

  if (results.length === 0) {
    throw new Error("No routes (OSRM/네트워크 확인)");
  }

  return results
    .sort((a, b) => a.score - b.score)
    .slice(0, c)
    .map((r, idx) => ({
      routeId: r.routeId,
      userId,
      minutes,
      deg: r.deg,
      loopRadiusM,
      title: `${minutes}분 산책 추천 ${idx + 1}`,
      durationSec: Math.round(r.durationSec),
      distanceM: Math.round(r.distanceM),
      geometry: r.geometry,
      traits: r.traits,
      explanation: r.traits.explanation,
    }));
}

export { recommend3, analyzeRouteOsrm, makeDeterministicRouteId };