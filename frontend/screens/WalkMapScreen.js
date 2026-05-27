import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
  Pressable,
  Modal,
} from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import WalkControlBar from "./WalkControlBar";
import EndWalkConfirmScreen from "./EndWalkConfirmScreen";
import WalkReviewScreen from "./WalkReviewScreen";
import { POI_SERVICE_BASE_URL } from "../config/config";

const KAKAO_JS_KEY = "11d7dbc230380a0189daebce58d6ddb8";

const CATEGORY_CONFIG = [
  { key: "CAFE", label: "☕ 애견동반 카페", bg: "#f6eaff", text: "#aa71a8", bgActive: "#aa71a8" },
  { key: "HOSPITAL", label: "🏥 동물 병원", bg: "#E8F6E8", text: "#2E8B57", bgActive: "#37A66A" },
  { key: "RESTAURANT", label: "🍔 애견동반 식당", bg: "#FBE3E6", text: "#D4637A", bgActive: "#E06A84" },
];

const makeHtml = () => `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    html, body, #map {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
    }

    .route-arrow-wrap {
      position: relative;
      pointer-events: none;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .route-arrow {
      width: 0;
      height: 0;
      opacity: 0.96;
    }

    .start-end-marker-wrap {
      position: relative;
      width: 78px;
      height: 78px;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }

    .start-end-glow {
      position: absolute;
      width: 78px;
      height: 78px;
      border-radius: 999px;
      background: radial-gradient(
        circle,
        rgba(255, 126, 173, 0.28) 0%,
        rgba(255, 126, 173, 0.18) 45%,
        rgba(255, 126, 173, 0.05) 72%,
        rgba(255, 126, 173, 0) 100%
      );
      filter: blur(1px);
      z-index: 1;
    }

    .start-end-flag {
      min-width: 44px;
      height: 44px;
      padding: 0 8px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.96);
      border: 3px solid #ff6fa8;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 31px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.28);
      filter: drop-shadow(0 2px 3px rgba(0,0,0,0.25));
      z-index: 2;
    }

    .user-location-wrap {
      position: relative;
      width: 110px;
      height: 110px;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }

    .user-location-glow {
      position: absolute;
      width: 108px;
      height: 108px;
      border-radius: 999px;
      background: radial-gradient(
        circle,
        rgba(255, 214, 102, 0.38) 0%,
        rgba(255, 214, 102, 0.26) 38%,
        rgba(255, 214, 102, 0.12) 68%,
        rgba(255, 214, 102, 0) 100%
      );
      filter: blur(1.4px);
      z-index: 1;
    }

    .user-location-arrow-shell {
      position: absolute;
      left: 0;
      top: 0;
      width: 110px;
      height: 110px;
      transform-origin: 55px 55px;
      z-index: 3;
    }

    .user-location-arrow {
      position: absolute;
      left: 43px;
      top: 2px;
      width: 0;
      height: 0;
      border-left: 12px solid transparent;
      border-right: 12px solid transparent;
      border-bottom: 36px solid #FFD666;
      filter:
        drop-shadow(0 0 0 #ffffff)
        drop-shadow(0 3px 4px rgba(0,0,0,0.25));
    }

    .user-location-dog-ring {
      position: absolute;
      width: 76px;
      height: 76px;
      border-radius: 999px;
      background: #FFD666;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow:
        0 4px 12px rgba(0,0,0,0.24),
        0 0 0 3px rgba(255,255,255,0.95);
      z-index: 5;
    }

    .user-location-dog {
      width: 64px;
      height: 64px;
      border-radius: 999px;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .user-location-dog img {
      width: 48px;
      height: 48px;
      object-fit: contain;
      display: block;
    }
  </style>
</head>
<body>
  <div id="map"></div>

  <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}"></script>

  <script>
    var map = null;

    var userOverlay = null;
    var lastHeading = 0;

    var passedOutline = null;
    var passedMain = null;
    var remainingOutline = null;
    var remainingMain = null;
    var activeOutline = null;
    var activeMain = null;

    var startEndOverlay = null;
    var fullPath = [];
    var furthestPassedIndex = 0;
    var didInitialCenter = false;
    var progressStarted = false;

    var arrowOverlays = [];
    var poiMarkers = [];
    var infoWindows = [];

    var ROUTE_COLOR = "#C9A36A";
    var PASSED_COLOR = "#9E9E9E";
    var ARROW_COLOR = "#F3E4C6";

    var START_THRESHOLD = 35;
    var SNAP_THRESHOLD = 25;
    var ACTIVE_LOOKAHEAD_METERS = 950;

    var DOG_MARKER_URL = "https://cdn-icons-png.flaticon.com/512/3089/3089423.png";

    function thinCoords(coords, step) {
      if (!coords || coords.length <= 2) return coords || [];
      var out = [];
      for (var i = 0; i < coords.length; i += step) out.push(coords[i]);
      if (coords.length > 0) out.push(coords[coords.length - 1]);
      return out;
    }

    function getArrowConfig() {
      var level = map ? map.getLevel() : 2;
      if (level <= 1) return { spacing: 9, width: 5.2, height: 1.8, wrap: 8 };
      if (level === 2) return { spacing: 12, width: 5.0, height: 1.8, wrap: 8 };
      if (level === 3) return { spacing: 16, width: 4.8, height: 1.7, wrap: 8 };
      if (level === 4) return { spacing: 24, width: 4.4, height: 1.6, wrap: 7 };
      return { spacing: 34, width: 4.0, height: 1.5, wrap: 7 };
    }

    function clearArrows() {
      try {
        for (var i = 0; i < arrowOverlays.length; i++) {
          arrowOverlays[i].setMap(null);
        }
        arrowOverlays = [];
      } catch (e) {}
    }

    function clearRouteLines() {
      try {
        if (passedOutline) { passedOutline.setMap(null); passedOutline = null; }
        if (passedMain) { passedMain.setMap(null); passedMain = null; }
        if (remainingOutline) { remainingOutline.setMap(null); remainingOutline = null; }
        if (remainingMain) { remainingMain.setMap(null); remainingMain = null; }
        if (activeOutline) { activeOutline.setMap(null); activeOutline = null; }
        if (activeMain) { activeMain.setMap(null); activeMain = null; }
        clearArrows();
      } catch (e) {}
    }

    function clearStartEndMarker() {
      try {
        if (startEndOverlay) {
          startEndOverlay.setMap(null);
          startEndOverlay = null;
        }
      } catch (e) {}
    }

    function clearAllRoute() {
      clearRouteLines();
      clearStartEndMarker();
    }

    function clearPois() {
      for (var i = 0; i < poiMarkers.length; i++) poiMarkers[i].setMap(null);
      poiMarkers = [];

      for (var j = 0; j < infoWindows.length; j++) infoWindows[j].close();
      infoWindows = [];
    }

    function distMeters(lat1, lng1, lat2, lng2) {
      var R = 6371000;
      var dLat = (lat2 - lat1) * Math.PI / 180;
      var dLng = (lng2 - lng1) * Math.PI / 180;
      var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }

    function getBearingAngle(from, to) {
      var lat1 = from.getLat() * Math.PI / 180;
      var lat2 = to.getLat() * Math.PI / 180;
      var dLng = (to.getLng() - from.getLng()) * Math.PI / 180;

      var y = Math.sin(dLng) * Math.cos(lat2);
      var x =
        Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

      var angle = Math.atan2(y, x) * 180 / Math.PI;
      return (angle + 360) % 360;
    }

    function interpolateLatLng(from, to, ratio) {
      var lat = from.getLat() + (to.getLat() - from.getLat()) * ratio;
      var lng = from.getLng() + (to.getLng() - from.getLng()) * ratio;
      return new kakao.maps.LatLng(lat, lng);
    }

    function getPathByMeters(path, maxMeters) {
      if (!path || path.length < 2) return path || [];

      var result = [path[0]];
      var total = 0;

      for (var i = 1; i < path.length; i++) {
        var prev = path[i - 1];
        var curr = path[i];

        var d = distMeters(prev.getLat(), prev.getLng(), curr.getLat(), curr.getLng());
        if (d < 1) continue;

        if (total + d <= maxMeters) {
          result.push(curr);
          total += d;
        } else {
          var remain = maxMeters - total;
          var ratio = Math.max(0, Math.min(1, remain / d));
          result.push(interpolateLatLng(prev, curr, ratio));
          break;
        }
      }

      return result;
    }

    function drawArrowMarkers(path) {
      clearArrows();
      if (!path || path.length < 2) return;

      var config = getArrowConfig();
      var spacing = config.spacing;
      var width = config.width;
      var height = config.height;
      var wrap = config.wrap;
      var nextArrowAt = spacing;

      for (var i = 1; i < path.length; i++) {
        var prev = path[i - 1];
        var curr = path[i];

        var segmentDistance = distMeters(prev.getLat(), prev.getLng(), curr.getLat(), curr.getLng());
        if (segmentDistance < 1) continue;

        while (nextArrowAt <= segmentDistance) {
          var ratio = nextArrowAt / segmentDistance;
          var arrowPos = interpolateLatLng(prev, curr, ratio);
          var bearing = getBearingAngle(prev, curr);
          var cssAngle = bearing - 90;

          var content =
            '<div class="route-arrow-wrap" style="' +
              'width:' + wrap + 'px;' +
              'height:' + wrap + 'px;' +
              'transform: rotate(' + cssAngle + 'deg);' +
            '">' +
              '<div class="route-arrow" style="' +
                'border-top:' + height + 'px solid transparent;' +
                'border-bottom:' + height + 'px solid transparent;' +
                'border-left:' + width + 'px solid ' + ARROW_COLOR + ';' +
              '"></div>' +
            '</div>';

          var overlay = new kakao.maps.CustomOverlay({
            position: arrowPos,
            content: content,
            xAnchor: 0.5,
            yAnchor: 0.5,
            zIndex: 60
          });

          overlay.setMap(map);
          arrowOverlays.push(overlay);
          nextArrowAt += spacing;
        }

        nextArrowAt -= segmentDistance;
      }
    }

    function drawStartEndMarker() {
      clearStartEndMarker();
      if (!fullPath || fullPath.length < 2) return;

      var start = fullPath[0];
      var end = fullPath[fullPath.length - 1];
      var samePoint = distMeters(start.getLat(), start.getLng(), end.getLat(), end.getLng()) <= 35;

      var content =
        '<div class="start-end-marker-wrap">' +
          '<div class="start-end-glow"></div>' +
          '<div class="start-end-flag">' + (samePoint ? '🏁' : '🎯') + '</div>' +
        '</div>';

      startEndOverlay = new kakao.maps.CustomOverlay({
        position: start,
        content: content,
        xAnchor: 0.5,
        yAnchor: 0.88,
        zIndex: 70
      });

      startEndOverlay.setMap(map);
    }

    function drawRouteWithProgress(passedPath, remainingPath) {
      clearRouteLines();

      if (passedPath && passedPath.length >= 2) {
        passedOutline = new kakao.maps.Polyline({
          path: passedPath,
          strokeWeight: 12,
          strokeColor: "#E8E8E8",
          strokeOpacity: 0.88,
          strokeStyle: "solid"
        });

        passedMain = new kakao.maps.Polyline({
          path: passedPath,
          strokeWeight: 8,
          strokeColor: PASSED_COLOR,
          strokeOpacity: 0.82,
          strokeStyle: "solid"
        });

        passedOutline.setMap(map);
        passedMain.setMap(map);
      }

      if (remainingPath && remainingPath.length >= 2) {
        remainingOutline = new kakao.maps.Polyline({
          path: remainingPath,
          strokeWeight: 12,
          strokeColor: "#FFFFFF",
          strokeOpacity: 0.65,
          strokeStyle: "solid"
        });

        remainingMain = new kakao.maps.Polyline({
          path: remainingPath,
          strokeWeight: 8,
          strokeColor: ROUTE_COLOR,
          strokeOpacity: 0.42,
          strokeStyle: "solid"
        });

        remainingOutline.setMap(map);
        remainingMain.setMap(map);

        var activePath = getPathByMeters(remainingPath, ACTIVE_LOOKAHEAD_METERS);

        if (activePath && activePath.length >= 2) {
          activeOutline = new kakao.maps.Polyline({
            path: activePath,
            strokeWeight: 12,
            strokeColor: "#FFFFFF",
            strokeOpacity: 0.95,
            strokeStyle: "solid"
          });

          activeMain = new kakao.maps.Polyline({
            path: activePath,
            strokeWeight: 8,
            strokeColor: ROUTE_COLOR,
            strokeOpacity: 1,
            strokeStyle: "solid"
          });

          activeOutline.setMap(map);
          activeMain.setMap(map);
          drawArrowMarkers(activePath);
        }
      }

      drawStartEndMarker();
    }

    function redrawCurrentRoute() {
      if (!fullPath || fullPath.length < 2) return;

      if (!progressStarted) {
        drawRouteWithProgress(null, fullPath);
        return;
      }

      var passed = fullPath.slice(0, furthestPassedIndex + 1);
      var remaining = fullPath.slice(furthestPassedIndex);

      drawRouteWithProgress(
        passed.length >= 2 ? passed : null,
        remaining.length >= 2 ? remaining : null
      );
    }

    function getUserOverlayContent(heading) {
      var safeHeading = Number.isFinite(Number(heading)) ? Number(heading) : lastHeading;
      lastHeading = safeHeading;

      return (
        '<div class="user-location-wrap">' +
          '<div class="user-location-glow"></div>' +
          '<div class="user-location-arrow-shell" style="transform: rotate(' + safeHeading + 'deg);">' +
            '<div class="user-location-arrow"></div>' +
          '</div>' +
          '<div class="user-location-dog-ring">' +
            '<div class="user-location-dog">' +
              '<img src="' + DOG_MARKER_URL + '" />' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }

    window.setRoute = function(route) {
      try {
        if (!map || !window.kakao || !window.kakao.maps) return;

        clearAllRoute();
        fullPath = [];
        furthestPassedIndex = 0;
        progressStarted = false;

        if (!route || !route.geometry || !route.geometry.coordinates || route.geometry.coordinates.length < 2) return;

        var raw = route.geometry.coordinates;
        var coords = thinCoords(raw, 1);

        for (var i = 0; i < coords.length; i++) {
          var lng = coords[i][0];
          var lat = coords[i][1];

          if (typeof lat === "number" && typeof lng === "number") {
            fullPath.push(new kakao.maps.LatLng(lat, lng));
          }
        }

        if (fullPath.length < 2) return;

        drawRouteWithProgress(null, fullPath);
      } catch (e) {
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage("setRoute error: " + e.message);
      }
    };

    window.updateRouteProgress = function(userLat, userLng) {
      try {
        if (!map || !window.kakao || !window.kakao.maps || fullPath.length < 2) return;

        var startPoint = fullPath[0];
        var distToStart = distMeters(userLat, userLng, startPoint.getLat(), startPoint.getLng());

        if (!progressStarted) {
          if (distToStart <= START_THRESHOLD) {
            progressStarted = true;
            furthestPassedIndex = 0;
          } else {
            drawRouteWithProgress(null, fullPath);
            return;
          }
        }

        var minDist = Infinity;
        var closestIdx = furthestPassedIndex;

        for (var i = furthestPassedIndex; i < fullPath.length; i++) {
          var p = fullPath[i];
          var d = distMeters(userLat, userLng, p.getLat(), p.getLng());

          if (d < minDist) {
            minDist = d;
            closestIdx = i;
          }
        }

        if (minDist <= SNAP_THRESHOLD && closestIdx > furthestPassedIndex) {
          furthestPassedIndex = closestIdx;
        }

        redrawCurrentRoute();
      } catch (e) {}
    };

    function createMap() {
      if (!window.kakao || !window.kakao.maps) {
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage("Kakao SDK not ready");
        return;
      }

      var container = document.getElementById("map");
      var options = {
        center: new kakao.maps.LatLng(37.5665, 126.9780),
        level: 2
      };

      map = new kakao.maps.Map(container, options);

      kakao.maps.event.addListener(map, "dragstart", function() {
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage("USER_MOVED_MAP");
      });

      kakao.maps.event.addListener(map, "zoom_start", function() {
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage("USER_MOVED_MAP");
      });

      kakao.maps.event.addListener(map, "zoom_changed", function() {
        redrawCurrentRoute();
      });

      window.ReactNativeWebView && window.ReactNativeWebView.postMessage("Map created OK");
    }

    window.setMyLocation = function(lat, lng, heading) {
      try {
        if (!map || !window.kakao || !window.kakao.maps) return;

        var pos = new kakao.maps.LatLng(lat, lng);

        if (!didInitialCenter) {
          map.setCenter(pos);
          didInitialCenter = true;
        }

        var content = getUserOverlayContent(heading);

        if (!userOverlay) {
          userOverlay = new kakao.maps.CustomOverlay({
            position: pos,
            content: content,
            xAnchor: 0.5,
            yAnchor: 0.5,
            zIndex: 90
          });
          userOverlay.setMap(map);
        } else {
          userOverlay.setPosition(pos);
          userOverlay.setContent(content);
        }
      } catch (e) {
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage("setMyLocation error");
      }
    };

    window.renderPois = function(pois) {
      try {
        if (!window.kakao || !window.kakao.maps || !map) return;

        clearPois();

        var list = Array.isArray(pois) ? pois : [];
        if (list.length === 0) return;

        list.forEach(function(p) {
          if (!Number.isFinite(Number(p.lat)) || !Number.isFinite(Number(p.lng))) return;

          var pos = new kakao.maps.LatLng(Number(p.lat), Number(p.lng));
          var marker = new kakao.maps.Marker({
            position: pos,
            zIndex: 15
          });

          marker.setMap(map);
          poiMarkers.push(marker);

          var content =
            '<div style="padding:10px;min-width:180px;">' +
              '<div style="font-size:15px;font-weight:700;margin-bottom:4px;">' + (p.title || "이름 없음") + '</div>' +
              '<div style="font-size:12px;color:#666;">' + (p.address || "") + '</div>' +
            '</div>';

          var infowindow = new kakao.maps.InfoWindow({ content: content });
          infoWindows.push(infowindow);

          kakao.maps.event.addListener(marker, "click", function() {
            infoWindows.forEach(function(iw) { iw.close(); });
            infowindow.open(map, marker);
          });
        });
      } catch (e) {
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage("renderPois error: " + e.message);
      }
    };

    window.addEventListener("load", function() {
      setTimeout(createMap, 300);
    });
  </script>
</body>
</html>
`;

function flattenPois(raw) {
  if (Array.isArray(raw)) return raw;

  if (raw && typeof raw === "object") {
    return Object.entries(raw).flatMap(([groupKey, arr]) => {
      if (!Array.isArray(arr)) return [];
      return arr.map((item) => ({
        ...item,
        category: item.category || groupKey,
      }));
    });
  }

  return [];
}

function normalizePoiCategory(raw) {
  const v = String(raw || "").toUpperCase().trim();

  if (v === "CAFE") return "CAFE";
  if (v === "HOSPITAL") return "HOSPITAL";
  if (v === "RESTAURANT") return "RESTAURANT";
  if (v === "PET") return "RESTAURANT";

  const lower = v.toLowerCase();
  if (lower.includes("cafe") || lower.includes("coffee") || lower.includes("카페")) return "CAFE";
  if (lower.includes("hospital") || lower.includes("vet") || lower.includes("동물병원")) return "HOSPITAL";
  if (lower.includes("restaurant") || lower.includes("애견") || lower.includes("식당")) return "RESTAURANT";

  return "";
}

function normalizeFavorite(item) {
  return Boolean(
    item.favorite === true ||
    item.isFavorite === true ||
    item.bookmarked === true ||
    item.liked === true
  );
}

function normalizePoi(item) {
  const lat = Number(item.lat ?? item.latitude ?? item.y);
  const lng = Number(item.lng ?? item.lon ?? item.longitude ?? item.x);

  let rawCategory = item.category ?? item.type ?? item.kind ?? item.group ?? "";

  if (!rawCategory) {
    if (item.vet === true) rawCategory = "HOSPITAL";
    else if (item.pet === true) rawCategory = "CAFE";
  }

  return {
    id: String(item.id ?? `${item.name ?? item.title ?? "poi"}-${lat}-${lng}`),
    title: item.title ?? item.name ?? item.place_name ?? "이름 없음",
    address: item.address ?? item.addr ?? item.address_name ?? item.road_address_name ?? "",
    lat,
    lng,
    category: normalizePoiCategory(rawCategory),
    favorite: normalizeFavorite(item),
  };
}

export default function WalkMapScreen({ navigation, route }) {
  const webviewRef = useRef(null);

  const [coords, setCoords] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isMyLocationActive, setIsMyLocationActive] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showWalkReview, setShowWalkReview] = useState(false);
  const [lastWalkStats, setLastWalkStats] = useState(null);

  const [poisRaw, setPoisRaw] = useState([]);
  const [poisLoading, setPoisLoading] = useState(true);

  const selectedRoute = route?.params?.selectedRoute;

  useEffect(() => {
    let subscription = null;
    let headingSubscription = null;

    (async () => {
      try {
        const enabled = await Location.hasServicesEnabledAsync();
        if (!enabled) {
          setErrorMsg("기기의 위치 서비스(GPS)가 꺼져 있어요. 켜고 다시 실행해주세요.!");
          return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("위치 권한이 거부되었습니다. (설정에서 허용 필요)");
          return;
        }

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 1000,
            distanceInterval: 2,
          },
          (loc) => {
            setCoords((prev) => ({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              heading:
                Number.isFinite(loc.coords.heading) && loc.coords.heading >= 0
                  ? loc.coords.heading
                  : prev?.heading ?? 0,
            }));
          }
        );

        headingSubscription = await Location.watchHeadingAsync((headingData) => {
          const nextHeading =
            Number.isFinite(headingData.trueHeading) && headingData.trueHeading >= 0
              ? headingData.trueHeading
              : Number.isFinite(headingData.magHeading) && headingData.magHeading >= 0
                ? headingData.magHeading
                : null;

          if (nextHeading === null) return;

          setCoords((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              heading: nextHeading,
            };
          });
        });
      } catch (err) {
        setErrorMsg("위치 추적 실패: " + String(err?.message ?? err));
      }
    })();

    return () => {
      subscription?.remove?.();
      headingSubscription?.remove?.();
    };
  }, []);

  useEffect(() => {
    const loadPois = async () => {
      try {
        setPoisLoading(true);

        const res = await fetch(`${POI_SERVICE_BASE_URL}/pois`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.detail || data?.error || "POI 로드 실패");
        }

        setPoisRaw(data);
      } catch (err) {
        console.error("POI fetch 실패:", err);
        setErrorMsg("POI 데이터를 불러오지 못했습니다: " + String(err?.message ?? err));
      } finally {
        setPoisLoading(false);
      }
    };

    loadPois();
  }, []);

  const allPois = useMemo(() => {
    return flattenPois(poisRaw)
      .map(normalizePoi)
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && !!p.category);
  }, [poisRaw]);

  const filteredPois = useMemo(() => {
    let list = allPois;

    if (selectedCategory !== null) {
      list = list.filter((p) => p.category === selectedCategory);
    }

    if (showFavoritesOnly) {
      list = list.filter((p) => p.favorite);
    }

    return list;
  }, [allPois, selectedCategory, showFavoritesOnly]);

  useEffect(() => {
    if (!coords || !mapReady || !webviewRef.current) return;

    const js = `
      window.setMyLocation(${coords.latitude}, ${coords.longitude}, ${coords.heading || 0});
      window.updateRouteProgress(${coords.latitude}, ${coords.longitude});
      true;
    `;

    webviewRef.current.injectJavaScript(js);
    setIsMyLocationActive(true);
  }, [coords, mapReady]);

  useEffect(() => {
    if (!mapReady || !webviewRef.current || !selectedRoute) return;

    const payload = JSON.stringify(selectedRoute);
    const js = `
      try { window.setRoute(${payload}); } catch (e) { void 0; }
      true;
    `;
    webviewRef.current.injectJavaScript(js);
  }, [mapReady, selectedRoute]);

  useEffect(() => {
    if (!mapReady || !webviewRef.current) return;

    const pois = selectedCategory === null && !showFavoritesOnly ? [] : filteredPois;

    const js = `
      window.renderPois(${JSON.stringify(pois)});
      true;
    `;
    webviewRef.current.injectJavaScript(js);
  }, [mapReady, filteredPois, selectedCategory, showFavoritesOnly]);

  const onSelectCategory = useCallback((key) => {
    setSelectedCategory((prev) => (prev === key ? null : key));
  }, []);

  const moveToCurrentLocation = useCallback(() => {
    if (!coords || !mapReady || !webviewRef.current) return;

    const js = `
      window.setMyLocation(${coords.latitude}, ${coords.longitude}, ${coords.heading || 0});
      true;
    `;
    webviewRef.current.injectJavaScript(js);
    setIsMyLocationActive(true);
  }, [coords, mapReady]);

  const toggleFavoritesOnly = useCallback(() => {
    setShowFavoritesOnly((prev) => !prev);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <WebView
          ref={webviewRef}
          style={styles.webview}
          originWhitelist={["*"]}
          javaScriptEnabled
          domStorageEnabled
          source={{ html: makeHtml(), baseUrl: "https://localhost" }}
          onMessage={(e) => {
            const msg = e.nativeEvent.data;

            if (msg === "Map created OK") {
              setMapReady(true);
            }

            if (msg === "USER_MOVED_MAP") {
              setIsMyLocationActive(false);
            }
          }}
        />

        {(!coords || poisLoading) && !errorMsg && (
          <View style={styles.overlay}>
            <ActivityIndicator />
            <Text style={styles.overlayText}>
              {!coords ? "현재 위치 가져오는 중…" : "POI 데이터 불러오는 중…"}
            </Text>
          </View>
        )}

        {!!errorMsg && (
          <View style={styles.overlay}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        <View style={styles.floatingButtonGroup}>
          <View style={styles.floatingButtonItem}>
            <Pressable
              style={({ pressed }) => [
                styles.floatingButton,
                styles.shadowButton,
                {
                  backgroundColor: isMyLocationActive
                    ? "rgba(220,220,220,0.95)"
                    : "rgba(255,255,255,0.92)",
                },
                pressed && styles.buttonPressed,
              ]}
              onPress={moveToCurrentLocation}
            >
              <Text style={styles.floatingButtonIcon}>📍</Text>
            </Pressable>
            <Text style={styles.floatingButtonLabel}>내 위치</Text>
          </View>

          <View style={styles.floatingButtonItem}>
            <Pressable
              style={({ pressed }) => [
                styles.floatingButton,
                styles.shadowButton,
                {
                  backgroundColor: showFavoritesOnly
                    ? "rgba(220,220,220,0.95)"
                    : "rgba(255,255,255,0.92)",
                },
                pressed && styles.buttonPressed,
              ]}
              onPress={toggleFavoritesOnly}
            >
              <Text style={styles.floatingButtonIcon}>⭐</Text>
            </Pressable>
            <Text style={styles.floatingButtonLabel}>즐겨찾기</Text>
          </View>
        </View>
      </View>

      <View style={styles.filterRow}>
        {CATEGORY_CONFIG.map((c) => {
          const active = selectedCategory === c.key;

          return (
            <Pressable
              key={c.key}
              style={({ pressed }) => [
                styles.chip,
                styles.shadowButton,
                { backgroundColor: active ? c.bgActive : c.bg },
                pressed && styles.buttonPressed,
              ]}
              onPress={() => onSelectCategory(c.key)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: active ? "#FFFFFF" : c.text },
                ]}
                numberOfLines={1}
              >
                {c.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <WalkControlBar
        coords={coords}
        onEndWalk={({ elapsedSeconds, distanceKm }) => {
          setLastWalkStats({ elapsedSeconds, distanceKm });
          setShowEndConfirm(true);
        }}
      />

      <Modal
        visible={showEndConfirm}
        animationType="slide"
        onRequestClose={() => setShowEndConfirm(false)}
      >
        <EndWalkConfirmScreen
          onClose={() => setShowEndConfirm(false)}
          onConfirm={() => {
            setShowEndConfirm(false);
            setShowWalkReview(true);
          }}
        />
      </Modal>

      <Modal
        visible={showWalkReview}
        animationType="slide"
        onRequestClose={() => setShowWalkReview(false)}
      >
        <WalkReviewScreen
          onGoHome={() => {
            setShowWalkReview(false);
            setLastWalkStats(null);
            navigation.popToTop();
          }}
          walkTime={
            lastWalkStats
              ? `${Math.floor(lastWalkStats.elapsedSeconds / 60)}m ${lastWalkStats.elapsedSeconds % 60}s`
              : "0m 0s"
          }
          walkDistance={
            lastWalkStats
              ? `${lastWalkStats.distanceKm.toFixed(1)}km`
              : "0.0km"
          }
          selectedRoute={selectedRoute}
          walkStats={lastWalkStats}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  shadowButton: {
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  buttonPressed: {
    transform: [{ scale: 0.97 }],
  },

  mapContainer: { flex: 1 },
  webview: { flex: 1 },

  overlay: {
    position: "absolute",
    top: 170,
    left: 20,
    right: 20,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  overlayText: { marginTop: 8 },
  errorText: { color: "crimson" },

  floatingButtonGroup: {
    position: "absolute",
    right: 18,
    top: 138,
    zIndex: 25,
    gap: 14,
    alignItems: "center",
  },
  floatingButtonItem: {
    alignItems: "center",
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
  },
  floatingButtonIcon: {
    fontSize: 24,
  },
  floatingButtonLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "900",
    color: "#3F3F3F",
    backgroundColor: "rgba(255,255,255,0.72)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: "hidden",
  },

  filterRow: {
    position: "absolute",
    bottom: 45,
    left: 20,
    right: 20,
    zIndex: 20,
    flexDirection: "row",
    gap: 12,
  },
  chip: {
    flex: 1,
    height: 42,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "800",
  },
}); 