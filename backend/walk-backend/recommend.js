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

// 두 좌표 사이 거리 (Haversine, meters)
function haversine(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// 거리(m) → 분 (도보 페이스 기준)
function metersToMinutes(m) {
  return m / PACE_M_PER_MIN;
}

// `lng,lat;lng,lat;...` 직렬화
function coordsToParam(points) {
  return points.map((p) => `${p.lng},${p.lat}`).join(";");
}

/* ---------------- OSRM 호출 ---------------- */

async function osrmRoute(points) {
  const coords = coordsToParam(points);
  const url =
    `${OSRM_BASE}/route/v1/${PROFILE}/${coords}` +
    `?overview=full&geometries=geojson&steps=false&alternatives=false`;

  const res = await fetchFn(url);
  if (!res.ok) {
    throw new Error(`OSRM route failed: ${res.status}`);
  }
  const data = await res.json();
  if (data.code !== "Ok" || !data.routes?.length) {
    throw new Error(`OSRM route error: ${data.code || "unknown"}`);
  }
  return data.routes[0];
}

async function osrmNearest(point) {
  const url = `${OSRM_BASE}/nearest/v1/${PROFILE}/${point.lng},${point.lat}?number=1`;
  const res = await fetchFn(url);
  if (!res.ok) throw new Error(`OSRM nearest failed: ${res.status}`);
  const data = await res.json();
  if (data.code !== "Ok" || !data.waypoints?.length) {
    throw new Error(`OSRM nearest error: ${data.code || "unknown"}`);
  }
  const [lng, lat] = data.waypoints[0].location;
  return { lat, lng };
}

/* ---------------- 후보 루프 생성 ---------------- */

/**
 * 한 방위각으로 왕복 루프 후보 1개 생성.
 * start → turn(방위각 deg, 반경 r) → start
 */
async function buildLoopCandidate(start, targetMeters, deg) {
  // 직선거리 기준 turn까지 갔다오면 도로 굴곡으로 실제 거리가 길어지므로
  // 목표의 절반보다 작게 잡는다 (계수 0.6).
  const r = (targetMeters / 2) * 0.6;
  const turn = waypoint(start, r, deg);

  const snapped = await osrmNearest(turn).catch(() => null);
  if (!snapped) return null;

  const route = await osrmRoute([start, snapped, start]).catch(() => null);
  if (!route) return null;

  return { deg, route, turn: snapped };
}

/* ---------------- 점수화 ---------------- */

/**
 * 후보 루트에 점수를 매긴다 (0~1, 높을수록 좋음).
 * - 거리 적합도: 목표 거리에 가까울수록 +
 * - 다양성: 다른 후보와 방위각이 멀수록 +
 * - 직선성 페널티: 너무 직선이면 - (왕복 산책으로 부적절)
 */
function scoreCandidates(candidates, targetMeters) {
  if (!candidates.length) return [];

  return candidates.map((c) => {
    const dist = c.route.distance;

    // 거리 적합도: 목표 대비 오차 비율
    const err = Math.abs(dist - targetMeters) / targetMeters;
    const distScore = Math.max(0, 1 - err); // 오차 100%면 0

    // 직선성: 시작점-끝점 직선거리 / 전체 거리
    // 루프라 시작=끝이지만, 경로 중간점과 시작점의 직선거리 비율로 근사
    const coords = c.route.geometry.coordinates;
    const mid = coords[Math.floor(coords.length / 2)];
    const startPt = { lat: coords[0][1], lng: coords[0][0] };
    const midPt = { lat: mid[1], lng: mid[0] };
    const straightness = (haversine(startPt, midPt) * 2) / dist;
    // 0.95 이상이면 거의 직선 왕복 → 페널티
    const loopScore = straightness > 0.95 ? 0.5 : 1;

    const score = distScore * 0.8 + loopScore * 0.2;
    return { ...c, score, distanceMeters: Math.round(dist) };
  });
}

/**
 * 상위 후보들 중 방위각이 너무 가까운 건 제거 (다양성 확보).
 */
function diversify(scored, { minDegGap = 45 } = {}) {
  const sorted = [...scored].sort((a, b) => b.score - a.score);
  const picked = [];

  for (const c of sorted) {
    const tooClose = picked.some((p) => {
      const d = Math.abs(p.deg - c.deg);
      const gap = Math.min(d, 360 - d);
      return gap < minDegGap;
    });
    if (!tooClose) picked.push(c);
  }
  return picked;
}

/* ---------------- 정규화 ---------------- */

function normalizeRoute(c, targetMeters) {
  const dist = c.route.distance;
  return {
    id: routeId(c.route.geometry),
    type: "loop",
    bearing: c.deg,
    targetMeters,
    distanceMeters: Math.round(dist),
    durationMinutes: Math.round(metersToMinutes(dist) * 10) / 10,
    score: Math.round(c.score * 1000) / 1000,
    geometry: c.route.geometry,
  };
}

/* ---------------- public API ---------------- */

/**
 * 출발지 + 목표 거리(m) 기반 도보 루트 추천.
 *
 * @param {{lat:number,lng:number}} start
 * @param {number} targetMeters - 원하는 루트 길이 (왕복)
 * @param {object} [opts]
 * @param {number} [opts.samples=12] - 시도할 방위각 개수
 * @param {number} [opts.limit=3]    - 반환할 상위 추천 개수
 * @param {number} [opts.minDegGap=45] - 추천 간 최소 방위각 차이
 * @returns {Promise<Array>} 추천 루트 배열 (점수 내림차순)
 */
export async function recommend(start, targetMeters, opts = {}) {
  const { samples = 12, limit = 3, minDegGap = 45 } = opts;

  if (!start || typeof start.lat !== "number" || typeof start.lng !== "number") {
    throw new Error("start must be {lat, lng}");
  }
  if (!Number.isFinite(targetMeters) || targetMeters <= 0) {
    throw new Error("targetMeters must be a positive number");
  }

  // 출발지를 도로망에 스냅
  const snappedStart = await osrmNearest(start);

  // 모든 방위각 후보를 병렬로 시도
  const tasks = [];
  for (let i = 0; i < samples; i++) {
    const deg = (360 / samples) * i;
    tasks.push(buildLoopCandidate(snappedStart, targetMeters, deg));
  }
  const results = (await Promise.all(tasks)).filter(Boolean);

  if (!results.length) {
    return [];
  }

  // 점수 매기고 다양성 확보 후 상위 N개
  const scored = scoreCandidates(results, targetMeters);
  const diverse = diversify(scored, { minDegGap });

  return diverse.slice(0, limit).map((c) => normalizeRoute(c, targetMeters));
}

/**
 * 시간(분) 기반 추천 — targetMeters 대신 분 단위로 받고 싶을 때.
 */
export async function recommendByMinutes(start, minutes, opts) {
  const targetMeters = minutes * PACE_M_PER_MIN;
  return recommend(start, targetMeters, opts);
}

export {
  roundCoord,
  routeId,
  waypoint,
  haversine,
  metersToMinutes,
  osrmRoute,
  osrmNearest,
};