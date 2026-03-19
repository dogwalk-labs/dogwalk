// MapScreen.js
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { View, ActivityIndicator, StyleSheet, Text, Pressable } from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";

const KAKAO_JS_KEY = process.env.EXPO_PUBLIC_KAKAO_JS_KEY;
const API_BASE = "http://192.168.1.19:8080";

const CATEGORY_CONFIG = [
  { key: "CAFE",       label: "☕ 애견동반 카페",           bg: "#f6eaff", text: "#aa71a8", bgActive: "#aa71a8" },
  { key: "HOSPITAL",   label: "🏥 동물 병원",      bg: "#E8F6E8", text: "#2E8B57", bgActive: "#37A66A" },
  { key: "RESTAURANT", label: "🍔 애견동반 식당",  bg: "#FBE3E6", text: "#D4637A", bgActive: "#E06A84" },
];

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
  </style>
</head>
<body>
  <div id="map"></div>

  <script>
    var map = null;
    var myMarker = null;
    var poiMarkers = [];
    var infoWindows = [];
    var markerImage = null;

    function getDogMarkerImage() {
      if (!window.kakao || !window.kakao.maps) return null;
      if (markerImage) return markerImage;

      markerImage = new kakao.maps.MarkerImage(
        "https://cdn-icons-png.flaticon.com/512/3089/3089423.png",
        new kakao.maps.Size(60, 60),
        { offset: new kakao.maps.Point(30, 60) }
      );

      return markerImage;
    }

    function clearPois() {
      for (var i = 0; i < poiMarkers.length; i++) {
        poiMarkers[i].setMap(null);
      }
      poiMarkers = [];

      for (var j = 0; j < infoWindows.length; j++) {
        infoWindows[j].close();
      }
      infoWindows = [];
    }

    function createMap() {
      if (!window.kakao || !window.kakao.maps) {
        window.ReactNativeWebView?.postMessage("Kakao SDK not ready");
        return;
      }

      var container = document.getElementById("map");
      var options = {
        center: new kakao.maps.LatLng(37.5665, 126.9780),
        level: 3
      };

      map = new kakao.maps.Map(container, options);

      kakao.maps.event.addListener(map, "dragstart", function() {
        window.ReactNativeWebView?.postMessage("USER_MOVED_MAP");
      });

      kakao.maps.event.addListener(map, "zoom_start", function() {
        window.ReactNativeWebView?.postMessage("USER_MOVED_MAP");
      });

      window.ReactNativeWebView?.postMessage("Map created OK");
    }

    window.setMyLocation = function(lat, lng) {
      try {
        if (!window.kakao || !window.kakao.maps || !map) return;

        var pos = new kakao.maps.LatLng(lat, lng);
        map.setCenter(pos);

        if (!myMarker) {
          myMarker = new kakao.maps.Marker({
            position: pos,
            image: getDogMarkerImage()
          });
          myMarker.setMap(map);
        } else {
          myMarker.setPosition(pos);
        }
      } catch (e) {
        window.ReactNativeWebView?.postMessage("setMyLocation error: " + e.message);
      }
    };

    window.renderPois = function(pois) {
      try {
        if (!window.kakao || !window.kakao.maps || !map) return;

        clearPois();

        var list = Array.isArray(pois) ? pois : [];
        if (list.length === 0) return;

        var bounds = new kakao.maps.LatLngBounds();

        list.forEach(function(p) {
          if (!Number.isFinite(Number(p.lat)) || !Number.isFinite(Number(p.lng))) return;

          var pos = new kakao.maps.LatLng(Number(p.lat), Number(p.lng));
          var marker = new kakao.maps.Marker({ position: pos });
          marker.setMap(map);
          poiMarkers.push(marker);
          bounds.extend(pos);

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

        if (myMarker) {
          bounds.extend(myMarker.getPosition());
        }

        map.setBounds(bounds);
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

export default function MapScreen({ navigation }) {
  const webviewRef = useRef(null);

  const [coords, setCoords] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [poisRaw, setPoisRaw] = useState([]);
  const [poisLoading, setPoisLoading] = useState(true);

  const [isMyLocationActive, setIsMyLocationActive] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

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

        const res = await fetch(`${API_BASE}/pois`);
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
      window.setMyLocation(${coords.latitude}, ${coords.longitude});
      true;
    `;
    webviewRef.current.injectJavaScript(js);
    setIsMyLocationActive(true);
  }, [coords, mapReady]);

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
      window.setMyLocation(${coords.latitude}, ${coords.longitude});
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
      <View style={styles.topBar}>
        <Pressable
          style={({ pressed }) => [
            styles.topBarButton,
            styles.shadowButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => navigation.navigate("TimeSelect")}
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