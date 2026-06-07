import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { View, ActivityIndicator, StyleSheet, Text, Pressable } from "react-native";
import { WebView } from "react-native-webview";
import { useFocusEffect } from "@react-navigation/native";
import * as Location from "expo-location";
import { POI_SERVICE_BASE_URL, API_BASE_URL } from "../../config/config";
import { getAccessToken } from "../../auth/authStorage";

const KAKAO_JS_KEY = "11d7dbc230380a0189daebce58d6ddb8";

const POI_RADIUS_KM = 2.5;

const CATEGORY_CONFIG = [
  {
    key: "CAFE",
    label: "☕ 애견동반 카페",
    bg: "#f6eaff",
    text: "#aa71a8",
    markerColor: "#aa71a8",
  },
  {
    key: "HOSPITAL",
    label: "🏥 동물 병원",
    bg: "#E8F6E8",
    text: "#2E8B57",
    markerColor: "#37A66A",
  },
  {
    key: "RESTAURANT",
    label: "🍔 애견동반 식당",
    bg: "#FBE3E6",
    text: "#D4637A",
    markerColor: "#E06A84",
  },
];

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const makeHtml = () => `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
  />
  <style>
    html, body, #map {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
    }

    .poi-marker-wrap {
      position: relative;
      width: 32px;
      height: 46px;
    }

    .poi-marker-pin {
      position: absolute;
      left: 0;
      top: 0;
      width: 32px;
      height: 46px;
      filter: drop-shadow(0 3px 5px rgba(0,0,0,0.35));
    }

    .poi-marker-pin svg {
      display: block;
      width: 32px;
      height: 46px;
    }

    .poi-marker-dot {
      position: absolute;
      left: 50%;
      top: 13px;
      width: 11px;
      height: 11px;
      border-radius: 50%;
      background: #ffffff;
      transform: translateX(-50%);
      pointer-events: none;
    }

    .poi-card-wrap {
      width: 210px;
      transform: translateY(-54px);
    }

    .poi-card {
      width: 210px;
      padding: 14px 14px 16px;
      background: #ffffff;
      border: 2px solid #CDB79E;
      border-radius: 18px;
      box-shadow: 0 5px 14px rgba(0,0,0,0.18);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      box-sizing: border-box;
      position: relative;
    }

    .poi-card::after {
      content: "";
      position: absolute;
      left: 50%;
      bottom: -9px;
      width: 14px;
      height: 14px;
      background: #ffffff;
      border-right: 2px solid #CDB79E;
      border-bottom: 2px solid #CDB79E;
      transform: translateX(-50%) rotate(45deg);
    }

    .poi-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
      gap: 8px;
    }

    .poi-title {
      font-size: 16px;
      font-weight: 800;
      color: #4A3A2A;
      flex: 1;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .heart-btn {
      border: none;
      background: transparent;
      font-size: 24px;
      line-height: 24px;
      padding: 0;
      margin: 0;
      position: relative;
      z-index: 2;
    }

    .poi-address {
      font-size: 13px;
      color: #777;
      margin-bottom: 8px;
    }

    .poi-rating {
      font-size: 14px;
      color: #6A5A4A;
      margin-bottom: 14px;
    }

    .review-btn {
      width: 128px;
      height: 36px;
      border: none;
      border-radius: 18px;
      background: #CDB79E;
      color: white;
      font-size: 13px;
      font-weight: 800;
      display: block;
      margin: 0 auto;
      position: relative;
      z-index: 2;
    }
  </style>
</head>
<body>
  <div id="map"></div>

  <script>
    var map = null;
    var myMarker = null;
    var myMarkerImage = null;
    var poiMarkerOverlays = [];
    var poiCardOverlays = [];
    var selectedPoiId = null;
    var hasInitialCentered = false;
    var ignoreNextMapClick = false;

    var CATEGORY_STYLE = {
      CAFE: { label: "☕ 애견동반 카페", color: "#aa71a8" },
      HOSPITAL: { label: "🏥 동물 병원", color: "#37A66A" },
      RESTAURANT: { label: "🍔 애견동반 식당", color: "#E06A84" }
    };

    function postOverlayMessage(message) {
      ignoreNextMapClick = true;
      window.ReactNativeWebView?.postMessage(message);

      setTimeout(function() {
        ignoreNextMapClick = false;
      }, 250);
    }

    function escapeHtml(value) {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    function getDogMarkerImage() {
      if (myMarkerImage) return myMarkerImage;

      myMarkerImage = new kakao.maps.MarkerImage(
        "https://cdn-icons-png.flaticon.com/512/3089/3089423.png",
        new kakao.maps.Size(56, 56),
        { offset: new kakao.maps.Point(28, 56) }
      );

      return myMarkerImage;
    }

    function clearPois() {
      poiMarkerOverlays.forEach(function(overlay) {
        overlay.setMap(null);
      });
      poiMarkerOverlays = [];

      poiCardOverlays.forEach(function(overlay) {
        overlay.setMap(null);
      });
      poiCardOverlays = [];
    }

    function createMap() {
      if (!window.kakao || !window.kakao.maps) {
        window.ReactNativeWebView?.postMessage("Kakao SDK not ready");
        return;
      }

      var container = document.getElementById("map");
      var options = {
        center: new kakao.maps.LatLng(37.5665, 126.9780),
        level: 4
      };

      map = new kakao.maps.Map(container, options);

      kakao.maps.event.addListener(map, "click", function() {
        if (ignoreNextMapClick) return;
        window.ReactNativeWebView?.postMessage("MAP_CLICK");
      });

      kakao.maps.event.addListener(map, "dragstart", function() {
        window.ReactNativeWebView?.postMessage("USER_MOVED_MAP");
      });

      kakao.maps.event.addListener(map, "zoom_start", function() {
        window.ReactNativeWebView?.postMessage("USER_MOVED_MAP");
      });

      window.ReactNativeWebView?.postMessage("Map created OK");
    }

    window.setMyLocation = function(lat, lng, shouldCenter) {
      try {
        if (!window.kakao || !window.kakao.maps || !map) return;

        var pos = new kakao.maps.LatLng(lat, lng);

        if (!myMarker) {
          myMarker = new kakao.maps.Marker({
            position: pos,
            image: getDogMarkerImage()
          });
          myMarker.setMap(map);
        } else {
          myMarker.setPosition(pos);
        }

        if (shouldCenter || !hasInitialCentered) {
          map.setCenter(pos);
          map.setLevel(4);
          hasInitialCentered = true;
        }
      } catch (e) {
        window.ReactNativeWebView?.postMessage("setMyLocation error: " + e.message);
      }
    };

    function makePoiMarker(p) {
      var style = CATEGORY_STYLE[p.category] || CATEGORY_STYLE.CAFE;
      var color = escapeHtml(style.color);

      return '' +
        '<div class="poi-marker-wrap" onclick="event.stopPropagation(); postOverlayMessage(\\'MARKER_CLICK:' + escapeHtml(p.id) + '\\')">' +
          '<div class="poi-marker-pin">' +
            '<svg viewBox="0 0 32 46" xmlns="http://www.w3.org/2000/svg">' +
              '<path d="M16 45C16 45 30 28.5 30 16C30 7.2 23.7 1 16 1C8.3 1 2 7.2 2 16C2 28.5 16 45 16 45Z" fill="' + color + '" stroke="#ffffff" stroke-width="2.5"/>' +
            '</svg>' +
          '</div>' +
          '<div class="poi-marker-dot"></div>' +
        '</div>';
    }

    function makePoiCard(p) {
      var title = escapeHtml(p.title || "이름 없음");
      var address = escapeHtml(p.address || "");
      var rating = Number.isFinite(Number(p.rating)) ? Number(p.rating).toFixed(1) : "0.0";
      var reviewCount = Number.isFinite(Number(p.reviewCount)) ? Number(p.reviewCount) : 0;
      var heart = p.favorite ? "♥" : "♡";
      var heartColor = p.favorite ? "#E94B5A" : "#9A9A9A";

      return '' +
        '<div class="poi-card-wrap" onclick="event.stopPropagation(); ignoreNextMapClick = true; setTimeout(function(){ ignoreNextMapClick = false; }, 250);">' +
          '<div class="poi-card">' +
            '<div class="poi-title-row">' +
              '<div class="poi-title">' + title + '</div>' +
              '<button class="heart-btn" style="color:' + heartColor + ';" onclick="event.stopPropagation(); postOverlayMessage(\\'FAVORITE_TOGGLE:' + escapeHtml(p.id) + '\\')">' +
                heart +
              '</button>' +
            '</div>' +
            '<div class="poi-address">' + address + '</div>' +
            '<div class="poi-rating">' +
              '<span style="color:#F5B400;font-size:16px;">★</span> ' +
              '<span style="font-weight:700;">' + rating + '</span> ' +
              '<span style="color:#888;">(' + reviewCount + ')</span>' +
            '</div>' +
            '<button class="review-btn" onclick="event.stopPropagation(); postOverlayMessage(\\'REVIEW_PRESS:' + escapeHtml(p.id) + '\\')">' +
              '리뷰 보기' +
            '</button>' +
          '</div>' +
        '</div>';
    }

    window.renderPois = function(pois, activePoiId, shouldFitBounds) {
      try {
        if (!window.kakao || !window.kakao.maps || !map) return;

        selectedPoiId = activePoiId || null;
        clearPois();

        var list = Array.isArray(pois) ? pois : [];
        if (list.length === 0) return;

        var bounds = new kakao.maps.LatLngBounds();

        list.forEach(function(p) {
          if (!Number.isFinite(Number(p.lat)) || !Number.isFinite(Number(p.lng))) return;

          var pos = new kakao.maps.LatLng(Number(p.lat), Number(p.lng));
          bounds.extend(pos);

          var markerOverlay = new kakao.maps.CustomOverlay({
            position: pos,
            content: makePoiMarker(p),
            xAnchor: 0.5,
            yAnchor: 1,
            zIndex: 5
          });

          markerOverlay.setMap(map);
          poiMarkerOverlays.push(markerOverlay);

          var cardOverlay = new kakao.maps.CustomOverlay({
            position: pos,
            content: makePoiCard(p),
            xAnchor: 0.5,
            yAnchor: 1,
            zIndex: 10
          });

          poiCardOverlays.push(cardOverlay);

          if (selectedPoiId === p.id) {
            cardOverlay.setMap(map);
          }
        });

        if (shouldFitBounds && list.length > 0) {
          map.setBounds(bounds);
        }
      } catch (e) {
        window.ReactNativeWebView?.postMessage("renderPois error: " + e.message);
      }
    };
  </script>

  <script
    src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}"
    onload="window.ReactNativeWebView?.postMessage('Kakao SDK loaded')"
    onerror="window.ReactNativeWebView?.postMessage('Kakao SDK load FAILED')">
  </script>

  <script>
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

function normalizeRating(item) {
  const reviewCount = Number(
    item.reviewCount ??
      item.review_count ??
      item.review_count_total ??
      item.reviewsCount ??
      item.reviews_count ??
      0
  );

  const rating = Number(
    item.rating ??
      item.avgRating ??
      item.averageRating ??
      item.average_rating ??
      item.score ??
      0
  );

  return {
    rating: Number.isFinite(rating) ? rating : 0,
    reviewCount: Number.isFinite(reviewCount) ? reviewCount : 0,
  };
}

function normalizePoi(item) {
  const lat = Number(item.lat ?? item.latitude ?? item.y);
  const lng = Number(item.lng ?? item.lon ?? item.longitude ?? item.x);

  let rawCategory = item.category ?? item.type ?? item.kind ?? item.group ?? "";

  if (!rawCategory) {
    if (item.vet === true) rawCategory = "HOSPITAL";
    else if (item.pet === true) rawCategory = "CAFE";
  }

  const ratingInfo = normalizeRating(item);

  return {
    id: String(item.id ?? `${item.name ?? item.title ?? "poi"}-${lat}-${lng}`),
    title: item.title ?? item.name ?? item.place_name ?? "이름 없음",
    address: item.address ?? item.addr ?? item.address_name ?? item.road_address_name ?? "",
    lat,
    lng,
    category: normalizePoiCategory(rawCategory),
    favorite: normalizeFavorite(item),
    rating: ratingInfo.rating,
    reviewCount: ratingInfo.reviewCount,
  };
}

export default function MapScreen({ navigation }) {
  const webviewRef = useRef(null);
  const lastMarkerClickTimeRef = useRef(0);

  const [coords, setCoords] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPoiId, setSelectedPoiId] = useState(null);
  const [poisRaw, setPoisRaw] = useState([]);
  const [poisLoading, setPoisLoading] = useState(true);

  const [isMyLocationActive, setIsMyLocationActive] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favoriteOverrides, setFavoriteOverrides] = useState({});
  const [reviewRefreshKey, setReviewRefreshKey] = useState(0);
  const [reviewStats, setReviewStats] = useState({});

  useFocusEffect(
    useCallback(() => {
      setReviewRefreshKey(Date.now());
    }, [])
  );

  useEffect(() => {
    let subscription = null;

    (async () => {
      try {
        const enabled = await Location.hasServicesEnabledAsync();
        if (!enabled) {
          setErrorMsg("기기의 위치 서비스(GPS)가 꺼져 있어요. 켜고 다시 실행해주세요.");
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
            setCoords({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
          }
        );
      } catch (err) {
        setErrorMsg("위치 추적 실패: " + String(err?.message ?? err));
      }
    })();

    return () => subscription?.remove?.();
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

  useEffect(() => {
    if (poisRaw.length === 0) return;

    const loadStats = async () => {
      const stats = {};

      await Promise.all(
        flattenPois(poisRaw)
          .map(normalizePoi)
          .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && !!p.category)
          .map(async (p) => {
            try {
              const res = await fetch(`${API_BASE_URL}/places/${p.id}/stats`);
              const data = await res.json();
              stats[p.id] = {
                rating: data.avgRating ?? 0,
                reviewCount: data.reviewCount ?? 0,
              };
            } catch {
              stats[p.id] = { rating: 0, reviewCount: 0 };
            }
          })
      );

      setReviewStats(stats);
    };

    loadStats();
  }, [poisRaw, reviewRefreshKey]);

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const token = await getAccessToken();
        console.log("### 즐겨찾기 로드 시작, token:", token ? "있음" : "없음");
        if (!token) return;

        const res = await fetch(`${API_BASE_URL}/places/my-favorites`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("### 즐겨찾기 응답 상태:", res.status);

        const data = await res.json();
        console.log("### 즐겨찾기 데이터:", data);

        const favMap = {};
        (data.favorites ?? []).forEach((poiId) => {
          favMap[poiId] = true;
        });

        setFavoriteOverrides(favMap);
      } catch (e) {
        console.error("즐겨찾기 로드 실패:", e);
      }
    };

    loadFavorites();
  }, []);

  const allPois = useMemo(() => {
    return flattenPois(poisRaw)
      .map(normalizePoi)
      .map((p) => ({
        ...p,
        favorite:
          favoriteOverrides[p.id] !== undefined
            ? favoriteOverrides[p.id]
            : p.favorite,
        rating: reviewStats[p.id]?.rating ?? p.rating,
        reviewCount: reviewStats[p.id]?.reviewCount ?? p.reviewCount,
      }))
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && !!p.category);
  }, [poisRaw, favoriteOverrides, reviewStats]);

  const filteredPois = useMemo(() => {
    let list = allPois;

    if (!coords) {
      return [];
    }

    list = list.filter((p) => {
      const distance = getDistanceKm(
        coords.latitude,
        coords.longitude,
        p.lat,
        p.lng
      );

      return distance <= POI_RADIUS_KM;
    });

    if (selectedCategory !== null) {
      list = list.filter((p) => p.category === selectedCategory);
    }

    if (showFavoritesOnly) {
      list = list.filter((p) => p.favorite);
    }

    return list;
  }, [allPois, coords, selectedCategory, showFavoritesOnly]);

  useEffect(() => {
    if (!coords || !mapReady || !webviewRef.current) return;

    const js = `
      window.setMyLocation(${coords.latitude}, ${coords.longitude}, false);
      true;
    `;

    webviewRef.current.injectJavaScript(js);
  }, [coords, mapReady]);

  useEffect(() => {
    if (!mapReady || !webviewRef.current) return;

    const shouldShowPois = selectedCategory !== null || showFavoritesOnly;
    const pois = shouldShowPois ? filteredPois : [];

    const js = `
      window.renderPois(
        ${JSON.stringify(pois)},
        ${JSON.stringify(selectedPoiId)},
        false
      );
      true;
    `;

    webviewRef.current.injectJavaScript(js);
  }, [mapReady, filteredPois, selectedCategory, showFavoritesOnly, selectedPoiId]);

  const onSelectCategory = useCallback((key) => {
    setSelectedPoiId(null);
    setShowFavoritesOnly(false);
    setSelectedCategory((prev) => (prev === key ? null : key));
  }, []);

  const moveToCurrentLocation = useCallback(() => {
    if (!coords || !mapReady || !webviewRef.current) return;

    const js = `
      window.setMyLocation(${coords.latitude}, ${coords.longitude}, true);
      true;
    `;

    webviewRef.current.injectJavaScript(js);
    setIsMyLocationActive(true);
  }, [coords, mapReady]);

  const toggleFavoritesOnly = useCallback(() => {
    setSelectedPoiId(null);
    setSelectedCategory(null);
    setShowFavoritesOnly((prev) => !prev);
  }, []);

  const toggleFavoriteById = useCallback(
    async (poiId) => {
      const target = allPois.find((p) => p.id === poiId);
      const currentFav =
        favoriteOverrides[poiId] !== undefined
          ? favoriteOverrides[poiId]
          : target?.favorite;

      const newFav = !currentFav;

      setFavoriteOverrides((prev) => ({ ...prev, [poiId]: newFav }));
      setSelectedPoiId(poiId);

      try {
        const token = await getAccessToken();
        console.log("### 즐겨찾기 토글:", poiId, "추가:", newFav);

        const res = await fetch(`${API_BASE_URL}/places/${poiId}/favorite`, {
          method: newFav ? "POST" : "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("### 즐겨찾기 저장 응답:", res.status);

        const data = await res.json();
        console.log("### 즐겨찾기 저장 결과:", data);
      } catch (e) {
        console.error("즐겨찾기 저장 실패:", e);
        setFavoriteOverrides((prev) => ({ ...prev, [poiId]: currentFav }));
      }
    },
    [allPois, favoriteOverrides]
  );

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable
          style={({ pressed }) => [
            styles.topBarButton,
            styles.shadowButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => navigation.navigate("WalkPreference")}
        >
          <Text style={styles.topBarText}>산책 갈 시간이다멍! 🐾</Text>
        </Pressable>
      </View>

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
            console.log("[WebView]", msg);

            if (msg === "Map created OK") {
              setMapReady(true);
              return;
            }

            if (msg === "USER_MOVED_MAP") {
              setIsMyLocationActive(false);
              return;
            }

            if (msg.startsWith("MARKER_CLICK:")) {
              lastMarkerClickTimeRef.current = Date.now();
              setSelectedPoiId(msg.replace("MARKER_CLICK:", ""));
              return;
            }

            if (msg === "MAP_CLICK") {
              const now = Date.now();

              if (now - lastMarkerClickTimeRef.current < 500) {
                return;
              }

              setSelectedPoiId(null);
              return;
            }

            if (msg.startsWith("FAVORITE_TOGGLE:")) {
              const poiId = msg.replace("FAVORITE_TOGGLE:", "");
              toggleFavoriteById(poiId);
              return;
            }

            if (msg.startsWith("REVIEW_PRESS:")) {
              const poiId = msg.replace("REVIEW_PRESS:", "");
              const poi = allPois.find((p) => p.id === poiId);

              navigation.navigate("PlaceReview", {
                poiId,
                poiTitle: poi?.title ?? "리뷰 보기",
                poiAddress: poi?.address ?? "",
                rating: poi?.rating ?? 0,
                reviewCount: poi?.reviewCount ?? 0,
              });
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
                { backgroundColor: active ? c.markerColor : c.bg },
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

  topBar: {
    position: "absolute",
    top: 80,
    left: 20,
    right: 20,
    zIndex: 20,
  },
  topBarButton: {
    backgroundColor: "rgba(251,243,221,0.96)",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#d4c3acff",
  },
  topBarText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2B2B2B",
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