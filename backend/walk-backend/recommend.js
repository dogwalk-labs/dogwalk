const crypto = require("crypto");

let fetchFn = global.fetch;
if (!fetchFn) fetchFn = require("node-fetch");

const OSRM_BASE = "http://localhost:5000";
const PACE_M_PER_MIN = 50;

/*이 위도,경도에서
    이 방향으로 이만큼(m) 걸어가면
    좌표가 어디?
*/
function makeWaypoint(start, meters, deg) { //deg=어느 방향으로갈지(각도,0-360도)
  const rad = (deg * Math.PI) / 180; //Math.sin, Math.cos은 라디안만 이해함
  const dLat = (meters * Math.cos(rad)) / 111320; //위도 변화량 계산, 위도 1도:111320m
  const dLng = //경도 변화량 계산
    (meters * Math.sin(rad)) /
    (111320 * Math.cos((start.lat * Math.PI) / 180));
  return { lat: start.lat + dLat, lng: start.lng + dLng }; //최종 목적지 좌표 완성
}

/* 지도선이 너무 촘촘하면
   점을 띄엄띄엄 골라서
   모양은 거의 그대로
   성능은 훨씬 빠르게
 */
function downsampleGeoJSON(geo, maxPoints = 500) { //geo: GeoJSON객체, maxPoints:좌표 최대 허용 개수
  const coords = geo?.coordinates; //좌표 배열 있으면 가져와
  if (!Array.isArray(coords) || coords.length <= maxPoints) return geo; //줄일 필요 없으면 그대로 반환

  const step = Math.ceil(coords.length / maxPoints); //Math.ceil: 무조건 500개를 넘지 않게 함
  const sampled = []; //줄인 좌표를 차곡차곡 담음
  for (let i = 0; i < coords.length; i += step) sampled.push(coords[i]); //일정 간격으로 좌표 뽑기

  const last = coords[coords.length - 1]; //도착 지점
  const tail = sampled[sampled.length - 1]; //지금까지 뽑힌 좌표 중 마지막
  if (!tail || tail[0] !== last[0] || tail[1] !== last[1]) sampled.push(last); //도착점 보장

  return { ...geo, coordinates: sampled }; //원본은 안 건드리고 새 객체 반환
}

/**
    출발->wp->출발 좌표 문자열을 만들고
    OSRM에 도보 라우팅을 요청한 뒤
    7초 안에 응답이 오면 첫 번째 경로만 반환하고
    늦거나 실패하면 에러 처리
**/
async function fetchRoundTrip(start, wp, timeoutMs = 7000) {
  const coords = `${start.lng},${start.lat};${wp.lng},${wp.lat};${start.lng},${start.lat}`;
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

  // 겹침 추정
  const gridM = 25;
  function gridKey([lng, lat]) {
    const x = Math.round(
      (lng * 111320 * Math.cos((lat * Math.PI) / 180)) / gridM
    );
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

  return {
    tags,
    explanation: lines.join(" "),
  };
}

// ✅ 각도 간격을 점점 촘촘하게 시도해서 최소 3개 확보
function makeDegs(stepDeg) {
  const out = [];
  for (let deg = 0; deg < 360; deg += stepDeg) out.push(deg);
  return out;
}

async function recommend3({ start, minutes, userId = "anon" }) {
  const targetSec = minutes * 60;
  const targetM = minutes * PACE_M_PER_MIN;

  const oneWayM = Math.max(200, Math.min(targetM / 2, 1200));

  // 🔁 1차 60도 → 부족하면 30도 → 20도
  const stepPlan = [60, 30, 20];

  const results = [];
  const tried = new Set();

  for (const stepDeg of stepPlan) {
    const degs = makeDegs(stepDeg).filter(d => !tried.has(d));
    degs.forEach(d => tried.add(d));

    await Promise.allSettled(
      degs.map(async (deg) => {
        try {
          const wp = makeWaypoint(start, oneWayM, deg);
          const route = await fetchRoundTrip(start, wp, 7000);

          const distanceM = Number(route.distance ?? 0);

          // 🔁 OSRM duration 우선, 없으면 페이스 환산
          const osrmSec = Number(route.duration ?? 0);
          const paceSec = (distanceM / PACE_M_PER_MIN) * 60;
          const durationSec = osrmSec > 0 ? osrmSec : paceSec;

          const timeDiff = Math.abs(durationSec - targetSec);
          const distDiff = Math.abs(distanceM - targetM);
          const score = timeDiff * 1.2 + distDiff * 0.08;

          // traits는 원본 geometry로 분석
          const traits = analyzeRouteOsrm(route);

          // 지도 표시용 geometry만 downsample
          const geometry = downsampleGeoJSON(route.geometry, 500);

          results.push({ deg, score, durationSec, distanceM, geometry, traits });
        } catch {
          // 스킵
        }
      })
    );

    const pool = results
      .filter(r => r.durationSec >= targetSec * 0.7 && r.durationSec <= targetSec * 1.35)
      .sort((a, b) => a.score - b.score);

    if (pool.length >= 3) {
      return pool.slice(0, 3).map((r, idx) => ({
        routeId: crypto.randomUUID(),
        userId,
        minutes,
        deg: r.deg,
        oneWayM,
        title: `${minutes}분 산책 추천 ${idx + 1}`,
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
      routeId: crypto.randomUUID(),
      userId,
      minutes,
      deg: r.deg,
      oneWayM,
      title: `${minutes}분 산책 추천 ${idx + 1}`,
      durationSec: Math.round(r.durationSec),
      distanceM: Math.round(r.distanceM),
      geometry: r.geometry,
      traits: r.traits,
      explanation: r.traits.explanation,
    }));
}

module.exports = { recommend3, analyzeRouteOsrm };
