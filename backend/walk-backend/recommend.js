// recommend.js (ESM - 3개 출력 보장 + 24개 방향 후보 + 공원/하천 취향 점수 반영)
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const OSRM_BASE = process.env.OSRM_BASE_URL || "http://localhost:5000";
const OSRM_PROFILE = process.env.OSRM_PROFILE || "foot";

const PACE_M_PER_MIN = 80;
const fetchFn = global.fetch;

if (!fetchFn) {
  throw new Error("fetch is not available. Use Node 18+.");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadJsonArray(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn(`JSON 로드 실패 또는 파일 없음: ${filePath}`);
    return [];
  }
}

const PARKS = loadJsonArray(path.join(__dirname, "data", "parks.json"));
const RIVERS = loadJsonArray(path.join(__dirname, "data", "rivers.json"));

function normalizeSelectedTags(selectedTags = []) {
  if (!Array.isArray(selectedTags)) return [];

  return selectedTags
    .map((tag) => String(tag).trim())
    .filter(Boolean);
}

function makeDeterministicRouteId(geometry) {
  const coordsStr = JSON.stringify(geometry?.coordinates ?? []);
  return crypto.createHash("sha1").update(coordsStr).digest("hex");
}

function makeWaypoint(start, meters, deg) {
  const rad = (deg * Math.PI) / 180;
  const dLat = (meters * Math.cos(rad)) / 111320;
  const dLng =
    (meters * Math.sin(rad)) /
    (111320 * Math.cos((start.lat * Math.PI) / 180));

  return { lat: start.lat + dLat, lng: start.lng + dLng };
}

function distanceM(a, b) {
  const R = 6371000;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function minDistanceRouteToPoint(geometry, point) {
  const coords = geometry?.coordinates ?? [];
  if (!coords.length) return Infinity;

  let min = Infinity;

  for (const [lng, lat] of coords) {
    const d = distanceM({ lat, lng }, point);
    if (d < min) min = d;
  }

  return min;
}

function preferenceBonus(geometry, selectedTags = []) {
  const tags = normalizeSelectedTags(selectedTags);

  let bonus = 0;
  const routeTags = [];

  const wantsPark =
    tags.includes("park") ||
    tags.includes("parks") ||
    tags.includes("공원");

  const wantsRiver =
    tags.includes("river") ||
    tags.includes("rivers") ||
    tags.includes("하천") ||
    tags.includes("천");

  if (wantsPark) {
    const nearPark = PARKS.some(
      (p) => Number.isFinite(Number(p.lat)) &&
        Number.isFinite(Number(p.lng)) &&
        minDistanceRouteToPoint(geometry, {
          lat: Number(p.lat),
          lng: Number(p.lng),
        }) <= 150
    );

    if (nearPark) {
      bonus += 700;
      routeTags.push("공원");
    }
  }

  if (wantsRiver) {
    const nearRiver = RIVERS.some(
      (r) => Number.isFinite(Number(r.lat)) &&
        Number.isFinite(Number(r.lng)) &&
        minDistanceRouteToPoint(geometry, {
          lat: Number(r.lat),
          lng: Number(r.lng),
        }) <= 150
    );

    if (nearRiver) {
      bonus += 700;
      routeTags.push("하천");
    }
  }

  return {
    bonus,
    tags: [...new Set(routeTags)],
  };
}

function downsampleGeoJSON(geo, maxPoints = 500) {
  const coords = geo?.coordinates;
  if (!Array.isArray(coords) || coords.length <= maxPoints) return geo;

  const step = Math.ceil(coords.length / maxPoints);
  const sampled = [];

  for (let i = 0; i < coords.length; i += step) sampled.push(coords[i]);

  const last = coords[coords.length - 1];
  const tail = sampled[sampled.length - 1];

  if (!tail || tail[0] !== last[0] || tail[1] !== last[1]) {
    sampled.push(last);
  }

  return { ...geo, coordinates: sampled };
}

async function fetchRoundTrip(start, deg, radiusM, timeoutMs = 8000) {
  const points = [];
  const loopCount = 5;

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

  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function analyzeRouteOsrm(route) {
  const totalDistanceM = Number(route.distance ?? 0);
  const distanceKm = Math.max(0.001, totalDistanceM / 1000);
  const coords = route?.geometry?.coordinates ?? [];

  let turnCount = 0;
  let sharpTurnCount = 0;
  let prevBearing = null;

  const stride = 6;

  for (let i = 0; i + stride < coords.length; i += stride) {
    const br = bearingDeg(coords[i], coords[i + stride]);

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
  tags.push(sharpTurnRatio > 0.25 ? "방향전환 큼" : "동선 단순");

  return {
    tags,
    explanation: "출발지로 돌아오는 순환 산책 루트입니다.",
  };
}

function coordKey(coord, precision = 4) {
  return `${coord[0].toFixed(precision)},${coord[1].toFixed(precision)}`;
}

function overlapRatio(geoA, geoB) {
  const a = geoA?.coordinates ?? [];
  const b = geoB?.coordinates ?? [];

  if (!a.length || !b.length) return 0;

  const setA = new Set(a.map((c) => coordKey(c)));
  let same = 0;

  for (const c of b) {
    if (setA.has(coordKey(c))) same++;
  }

  return same / Math.max(1, b.length);
}

function maxOverlapWithPicked(candidate, picked) {
  if (!picked.length) return 0;

  return Math.max(
    ...picked.map((r) => overlapRatio(r.geometry, candidate.geometry))
  );
}

const directionGroups = [
  [0, 15, 30, 45],
  [60, 75, 90, 105],
  [120, 135, 150, 165],
  [180, 195, 210, 225],
  [240, 255, 270, 285],
  [300, 315, 330, 345],
];

async function buildCandidate({
  start,
  minutes,
  targetSec,
  targetM,
  loopRadiusM,
  deg,
  banned,
  selectedTags = [],
}) {
  const route = await fetchRoundTrip(start, deg, loopRadiusM);

  const distanceM = Number(route.distance ?? 0);
  const osrmSec = Number(route.duration ?? 0);
  const paceSec = (distanceM / PACE_M_PER_MIN) * 60;
  const durationSec = osrmSec > 0 ? osrmSec : paceSec;

  if (durationSec < targetSec * 0.35 || durationSec > targetSec * 2.3) {
    return null;
  }

  const geometry = downsampleGeoJSON(route.geometry, 500);
  const routeId = makeDeterministicRouteId(geometry);

  if (banned.has(routeId)) return null;

  const traits = analyzeRouteOsrm(route);

  let score =
    Math.abs(durationSec - targetSec) * 1.2 +
    Math.abs(distanceM - targetM) * 0.08;

  if (traits.tags.includes("큰길 위주")) score += 300;
  if (traits.tags.includes("골목 많음")) score -= 100;

  const pref = preferenceBonus(geometry, selectedTags);
  score -= pref.bonus;

  traits.tags.push(...pref.tags);
  traits.tags = [...new Set(traits.tags)];

  return {
    deg,
    score,
    durationSec,
    distanceM,
    geometry,
    traits,
    routeId,
  };
}

async function recommend3({
  start,
  minutes,
  userId = "anon",
  count = 3,
  bannedRouteIds = [],
  selectedTags = [],
}) {
  const cRaw = Number(count);
  const c = Number.isFinite(cRaw)
    ? Math.max(1, Math.min(3, Math.floor(cRaw)))
    : 3;

  const safeSelectedTags = normalizeSelectedTags(selectedTags);

  const banned = new Set(
    Array.isArray(bannedRouteIds)
      ? bannedRouteIds.filter((x) => typeof x === "string" && x.length > 0)
      : []
  );

  const targetSec = minutes * 60;
  const targetM = minutes * PACE_M_PER_MIN;
  const loopRadiusM = Math.max(180, Math.min(targetM / 6, 700));

  const picked = [];
  const allCandidates = [];

  for (const group of directionGroups) {
    const groupResults = await Promise.allSettled(
      group.map((deg) =>
        buildCandidate({
          start,
          minutes,
          targetSec,
          targetM,
          loopRadiusM,
          deg,
          banned,
          selectedTags: safeSelectedTags,
        })
      )
    );

    const candidates = groupResults
      .filter((r) => r.status === "fulfilled" && r.value)
      .map((r) => r.value);

    for (const candidate of candidates) {
      allCandidates.push(candidate);
    }

    candidates.sort((a, b) => {
      const overlapA = maxOverlapWithPicked(a, picked);
      const overlapB = maxOverlapWithPicked(b, picked);

      const finalScoreA = a.score + overlapA * 1800;
      const finalScoreB = b.score + overlapB * 1800;

      return finalScoreA - finalScoreB;
    });

    const bestCandidate = candidates[0];

    if (bestCandidate) {
      picked.push(bestCandidate);
    }

    if (picked.length >= c) break;
  }

  if (picked.length < c) {
    const fallbackDegs = [15, 75, 135, 195, 255, 315];

    const fallbackResults = await Promise.allSettled(
      fallbackDegs.map((deg) =>
        buildCandidate({
          start,
          minutes,
          targetSec,
          targetM,
          loopRadiusM: loopRadiusM * 0.85,
          deg,
          banned,
          selectedTags: safeSelectedTags,
        })
      )
    );

    const fallbackCandidates = fallbackResults
      .filter((r) => r.status === "fulfilled" && r.value)
      .map((r) => r.value);

    for (const candidate of fallbackCandidates) {
      allCandidates.push(candidate);
    }

    fallbackCandidates.sort((a, b) => {
      const overlapA = maxOverlapWithPicked(a, picked);
      const overlapB = maxOverlapWithPicked(b, picked);

      const finalScoreA = a.score + overlapA * 1200;
      const finalScoreB = b.score + overlapB * 1200;

      return finalScoreA - finalScoreB;
    });

    for (const candidate of fallbackCandidates) {
      if (picked.length >= c) break;

      const alreadyPicked = picked.some((r) => r.routeId === candidate.routeId);
      if (!alreadyPicked) {
        picked.push(candidate);
      }
    }
  }

  if (picked.length < c) {
    allCandidates.sort((a, b) => a.score - b.score);

    for (const candidate of allCandidates) {
      if (picked.length >= c) break;

      const alreadyPicked = picked.some((r) => r.routeId === candidate.routeId);
      if (!alreadyPicked) {
        picked.push(candidate);
      }
    }
  }

  if (picked.length === 0) {
    throw new Error("No routes (OSRM/네트워크 확인)");
  }

  return picked.slice(0, c).map((r, idx) => ({
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