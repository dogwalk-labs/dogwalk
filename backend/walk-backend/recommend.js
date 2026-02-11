// recommend.js  (완전체 + start->wp1->wp2->start + wp2는 wp1라인 금지 + pace-time only)
const crypto = require("crypto");

let fetchFn = global.fetch;
if (!fetchFn) fetchFn = require("node-fetch");

const OSRM_BASE = "http://localhost:5000";

// ✅ 20분에 1km = 50 m/min
const PACE_M_PER_MIN = 50;

/*이 위도,경도에서 이 방향으로 이만큼(m) 걸어가면 좌표가 어디?*/
function makeWaypoint(start, meters, deg) {
  const rad = (deg * Math.PI) / 180;
  const dLat = (meters * Math.cos(rad)) / 111320;
  const dLng =
    (meters * Math.sin(rad)) /
    (111320 * Math.cos((start.lat * Math.PI) / 180));
  return { lat: start.lat + dLat, lng: start.lng + dLng };
}

/* 지도선이 너무 촘촘하면 점을 띄엄띄엄 골라서 성능 개선 */
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

/**
 * ✅ start -> wp1 -> wp2 -> start (2 waypoint)
 */
async function fetchRoute2wp(start, wp1, wp2, timeoutMs = 7000) {
  const coords =
    `${start.lng},${start.lat};` +
    `${wp1.lng},${wp1.lat};` +
    `${wp2.lng},${wp2.lat};` +
    `${start.lng},${start.lat}`;

  const url =
    `${OSRM_BASE}/route/v1/foot/${coords}` +
    `?overview=full&geometries=geojson&steps=false`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetchFn(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`OSRM error ${res.status}`);
    const json = await res.json();
    const r = json?.routes?.[0];
    if (!r) throw new Error("OSRM: no route");
    return r;
  } finally {
    clearTimeout(timer);
  }
}

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
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
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
      if (diff >= 25) turnCount += 1;
      if (diff >= 60) sharpTurnCount += 1;
    }
    prevBearing = br;
  }

  const turnsPerKm = turnCount / distanceKm;
  const sharpTurnRatio = turnCount ? sharpTurnCount / turnCount : 0;

  // 겹침 추정 (간단)
  const gridM = 25;
  function gridKey([lng, lat]) {
    const x = Math.round((lng * 111320 * Math.cos((lat * Math.PI) / 180)) / gridM);
    const y = Math.round((lat * 111320) / gridM);
    return `${x},${y}`;
  }

  const keys = Array.isArray(coords) ? coords.map(gridKey) : [];
  const n = keys.length;

  const uniq = new Set(keys);
  const repeatRatio = n ? 1 - uniq.size / n : 0;

  const half = Math.floor(n / 2);
  const first = new Set(keys.slice(0, half));
  let overlap = 0;
  for (const k of keys.slice(half)) if (first.has(k)) overlap++;
  const halfOverlapRatio = (n - half) ? overlap / (n - half) : 0;

  const tags = [];

  let streetTag = "혼합형";
  if (turnsPerKm > 12) streetTag = "골목 많음";
  else if (turnsPerKm < 6) streetTag = "큰길 위주";
  tags.push(streetTag);

  let loopTag = "혼합형";
  if (repeatRatio < 0.15 && halfOverlapRatio < 0.35) loopTag = "한 바퀴형";
  else if (repeatRatio > 0.35 || halfOverlapRatio > 0.6) loopTag = "왕복형";
  tags.push(loopTag);

  if (sharpTurnRatio > 0.25) tags.push("방향전환 큼");
  else tags.push("동선 단순");

  const lines = [];
  lines.push("출발지(현재 위치)로 다시 돌아오는 루트예요.");
  if (streetTag === "골목 많음") lines.push("방향 전환이 잦아 골목 느낌이 강해요.");
  else if (streetTag === "큰길 위주") lines.push("큰길 위주로 쭉 걷는 구간이 많아 리듬이 일정해요.");
  else lines.push("큰길이랑 골목이 섞여 있어 지루하지 않아요.");

  if (loopTag === "한 바퀴형") lines.push("동선이 겹치는 구간이 적어서 ‘한 바퀴’ 느낌이 강해요.");
  else if (loopTag === "왕복형") lines.push("되돌아오는 구간이 많아서 왕복 느낌이 나요.");
  else lines.push("겹치는 구간과 새 길이 섞인 혼합 스타일이에요.");

  return { tags, explanation: lines.join(" ") };
}

// ✅ 각도 간격을 점점 촘촘하게 시도해서 최소 3개 확보
function makeDegs(stepDeg) {
  const out = [];
  for (let deg = 0; deg < 360; deg += stepDeg) out.push(deg);
  return out;
}

// =========================
// ✅ deterministic routeId
// =========================
function roundCoord(n, p = 5) {
  const k = 10 ** p;
  return Math.round(n * k) / k;
}

function normalizeCoords(coords, precision = 5) {
  if (!Array.isArray(coords)) return [];
  return coords.map(([lng, lat]) => [roundCoord(lng, precision), roundCoord(lat, precision)]);
}

// v4 = 2wp + "다른길 왕복" + pace-time only
function makeRouteId({ minutes, deg, wp2SideDeg, oneWayM, wp2M, coords }) {
  const norm = normalizeCoords(coords, 5);
  const payload = {
    v: 4,
    minutes,
    deg,
    wp2SideDeg,            // wp2가 라인에서 얼마나 옆으로 비껴갔는지
    oneWayM: Math.round(oneWayM),
    wp2M: Math.round(wp2M),
    coords: norm,
  };
  return crypto.createHash("sha1").update(JSON.stringify(payload)).digest("hex");
}

/**
 * ✅ 완전체:
 * - deterministic routeId
 * - bannedRouteIds 지원
 * - start->wp1->wp2->start (2 waypoint)
 * - ✅ "다른 길로 돌아오기" 강제: wp2는 start->wp1 라인에서 일정 각도 이상 벗어난 위치
 * - ✅ durationSec는 OSRM 시간 무시, 페이스 기반으로만 계산
 */
async function recommend3({ start, minutes, userId = "anon", bannedRouteIds = [] }) {
  const targetSec = minutes * 60;
  const targetM = minutes * PACE_M_PER_MIN;

  // wp1: 멀리 찍기(대략 절반거리, 캡)
  const oneWayM = Math.max(250, Math.min(targetM / 2, 1300));

  // ✅ wp2는 "출발 근처" + "라인에서 옆으로 비켜" (return corridor 변경 목적)
  // - sidePlan: deg+180(반대방향) 기준으로 좌/우로 꺾어서 '다른 길로 복귀' 유도
  // - wp2DistPlan: start에서 너무 멀면 루프가 되기 쉬워서 0.25~0.45 * oneWayM 추천
  const sidePlan = [35, -35, 55, -55, 75, -75];     // 라인에서 최소 35도 이상 벗어남
  const wp2DistPlan = [0.28, 0.35, 0.42];           // start 기준 거리(멀리X, 너무 가까이X)

  const stepPlan = [60, 30, 20];

  const bannedSet = new Set(
    Array.isArray(bannedRouteIds) ? bannedRouteIds.filter((x) => typeof x === "string") : []
  );

  const results = [];
  const triedDeg = new Set();
  const seenRouteId = new Set();

  for (const stepDeg of stepPlan) {
    const degs = makeDegs(stepDeg).filter((d) => !triedDeg.has(d));
    degs.forEach((d) => triedDeg.add(d));

    await Promise.allSettled(
      degs.flatMap((deg) =>
        sidePlan.flatMap((side) =>
          wp2DistPlan.map(async (ratio) => {
            try {
              const wp1 = makeWaypoint(start, oneWayM, deg);

              // ✅ wp2는 "반대방향(되돌아오는 쪽)"에 두되, 라인에서 옆으로(side) 비켜둠
              //    -> wp1->wp2가 단순 직선 복귀가 아니라 다른 골목/블록을 타기 쉬움
              const wp2SideDeg = (deg + 180 + side + 360) % 360;
              const wp2M = Math.max(180, oneWayM * ratio);
              const wp2 = makeWaypoint(start, wp2M, wp2SideDeg);

              // ✅ 안전장치: wp2가 라인에 가까워지지 않게(각도차 최소 보장)
              // (정확한 직선 판정은 복잡하니, 설계상 side>=35로 강제)
              const route = await fetchRoute2wp(start, wp1, wp2, 7000);

              const distanceM = Number(route.distance ?? 0);

              // ✅ OSRM duration 무시: 내 페이스로만 시간 계산
              const durationSec = (distanceM / PACE_M_PER_MIN) * 60;

              const timeDiff = Math.abs(durationSec - targetSec);
              const distDiff = Math.abs(distanceM - targetM);
              const score = timeDiff * 1.2 + distDiff * 0.08;

              const traits = analyzeRouteOsrm(route);

              // ✅ 결정적 routeId: 원본 geometry 기반
              const rawCoords = route?.geometry?.coordinates ?? [];
              const routeId = makeRouteId({
                minutes,
                deg,
                wp2SideDeg,
                oneWayM,
                wp2M,
                coords: rawCoords,
              });

              if (bannedSet.has(routeId)) return;
              if (seenRouteId.has(routeId)) return;
              seenRouteId.add(routeId);

              const geometry = downsampleGeoJSON(route.geometry, 500);

              results.push({
                routeId,
                deg,
                wp2SideDeg,
                oneWayM,
                wp2M,
                score,
                durationSec,
                distanceM,
                geometry,
                traits,
              });
            } catch {
              // 스킵
            }
          })
        )
      )
    );

    const pool = results
      .filter((r) => r.durationSec >= targetSec * 0.7 && r.durationSec <= targetSec * 1.35)
      .sort((a, b) => a.score - b.score);

    if (pool.length >= 3) {
      return pool.slice(0, 3).map((r, idx) => ({
        routeId: r.routeId,
        userId,
        minutes,
        deg: r.deg,
        wp2SideDeg: r.wp2SideDeg,
        oneWayM: Math.round(r.oneWayM),
        wp2M: Math.round(r.wp2M),
        title: `${minutes}분 산책 추천 ${idx + 1}`,
        // ✅ 페이스 기반 시간
        durationSec: Math.round(r.durationSec),
        distanceM: Math.round(r.distanceM),
        geometry: r.geometry,
        traits: r.traits,
        explanation: r.traits.explanation,
      }));
    }
  }

  if (results.length === 0) throw new Error("No routes (OSRM/네트워크 확인)");

  return results
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((r, idx) => ({
      routeId: r.routeId,
      userId,
      minutes,
      deg: r.deg,
      wp2SideDeg: r.wp2SideDeg,
      oneWayM: Math.round(r.oneWayM),
      wp2M: Math.round(r.wp2M),
      title: `${minutes}분 산책 추천 ${idx + 1}`,
      durationSec: Math.round(r.durationSec),
      distanceM: Math.round(r.distanceM),
      geometry: r.geometry,
      traits: r.traits,
      explanation: r.traits.explanation,
    }));
}

module.exports = { recommend3, analyzeRouteOsrm };
