import crypto from "crypto";

const OSRM_BASE = process.env.OSRM_BASE_URL || "http://localhost:5000";
const PROFILE = "foot";

const PACE_M_PER_MIN = Number(process.env.PACE_M_PER_MIN || 80);

const fetchFn = global.fetch;

/* ---------------- util ---------------- */

function routeId(geometry) {
  return crypto
    .createHash("sha1")
    .update(JSON.stringify(geometry.coordinates))
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

/* ---------------- OSRM ---------------- */

async function snap(p) {
  const url =
    `${OSRM_BASE}/nearest/v1/${PROFILE}/${p.lng},${p.lat}?number=1`;

  const r = await fetchFn(url);
  const j = await r.json();

  const [lng, lat] = j.waypoints[0].location;

  return { lat, lng };
}

async function route(coords) {
  const url =
    `${OSRM_BASE}/route/v1/${PROFILE}/${coords}?overview=full&geometries=geojson`;

  const r = await fetchFn(url);
  const j = await r.json();

  return j.routes[0];
}

/* ---------------- radius ---------------- */

function radiusForMinutes(min) {

  if (min <= 30) return 350;
  if (min <= 45) return 550;
  return 750;

}

/* ---------------- circular loop ---------------- */

async function circularRoute(start, deg, radius, wpCount) {

  const wps = [];

  const step = 360 / wpCount;

  for (let i = 0; i < wpCount; i++) {

    wps.push(
      waypoint(start, radius, deg + step * i)
    );

  }

  const snapped = await Promise.all([
    snap(start),
    ...wps.map(snap)
  ]);

  const [s, ...others] = snapped;

  const coords = [
    `${s.lng},${s.lat}`,
    ...others.map(p => `${p.lng},${p.lat}`),
    `${s.lng},${s.lat}`
  ].join(";");

  return route(coords);
}

/* ---------------- main ---------------- */

async function recommend3({ start, minutes, count = 3 }) {

  const radius = radiusForMinutes(minutes);

  const waypointCount =
    minutes <= 30 ? 3 :
    minutes <= 45 ? 4 :
    5;

  const targetSec = minutes * 60;

  const candidates = [];

  for (let deg = 0; deg < 360; deg += 30) {

    try {

      const r = await circularRoute(
        start,
        deg,
        radius,
        waypointCount
      );

      const dist = r.distance;

      const duration =
        (dist / PACE_M_PER_MIN) * 60;

      const diff =
        Math.abs(duration - targetSec);

      candidates.push({

        routeId: routeId(r.geometry),

        score: diff,

        distanceM: dist,

        durationSec: duration,

        geometry: r.geometry

      });

    } catch {}

  }

  if (candidates.length === 0) {

    const r = await circularRoute(
      start,
      0,
      radius,
      waypointCount
    );

    return [{
      routeId: routeId(r.geometry),
      minutes,
      title: `${minutes}분 산책`,
      distanceM: r.distance,
      durationSec: r.distance / PACE_M_PER_MIN * 60,
      geometry: r.geometry
    }];

  }

  candidates.sort((a,b)=>a.score-b.score);

  const picked = [];

  for (const c of candidates) {

    const dup = picked.find(p =>
      Math.abs(p.distanceM - c.distanceM) < 400
    );

    if (dup) continue;

    picked.push(c);

    if (picked.length >= count) break;

  }

  for (const c of candidates) {

    if (picked.length >= count) break;

    if (!picked.find(p=>p.routeId===c.routeId))
      picked.push(c);

  }

  return picked.slice(0,count).map((r,i)=>({

    routeId:r.routeId,

    minutes,

    title:`${minutes}분 동네 한바퀴 ${i+1}`,

    distanceM:Math.round(r.distanceM),

    durationSec:Math.round(r.durationSec),

    geometry:r.geometry

  }));


}

export { recommend3 };