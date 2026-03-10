import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, ActivityIndicator, StyleSheet, Text, Pressable } from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";

const KAKAO_JS_KEY = "c501500e882a8cc704505df42be58a40";

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

  <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}"></script>

  <script>
    var map = null;
    var myMarker = null;
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
        if (!map || !window.kakao || !window.kakao.maps) return;

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
        window.ReactNativeWebView?.postMessage("setMyLocation error");
      }
    };

    window.addEventListener("load", function() {
      setTimeout(createMap, 300);
    });
  </script>
</body>
</html>
`;

const CATEGORY_CONFIG = [
  { key: "TOILET", label: "🗑️ 화장실", bg: "rgba(241,241,241,0.92)", text: "#6B6B6B", bgActive: "#9A9A9A" },
  { key: "HOSPITAL", label: "🏥 동물 병원", bg: "rgba(232,246,232,0.92)", text: "#2E8B57", bgActive: "#37A66A" },
  { key: "PET", label: "🍔 애견동반 식당", bg: "rgba(251,227,230,0.92)", text: "#D4637A", bgActive: "#E06A84" },
];

export default function MapScreen({ navigation }) {
  const webviewRef = useRef(null);

  const [coords, setCoords] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isMyLocationActive, setIsMyLocationActive] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    let subscription = null;

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
    if (!coords || !mapReady || !webviewRef.current) return;
    const js = `window.setMyLocation(${coords.latitude}, ${coords.longitude}); true;`;
    webviewRef.current.injectJavaScript(js);
  }, [coords, mapReady]);

  const onSelectCategory = useCallback((key) => {
    setSelectedCategory((prev) => (prev === key ? null : key));
  }, []);

  const moveToCurrentLocation = useCallback(() => {
    if (!coords || !mapReady || !webviewRef.current) return;
    const js = `window.setMyLocation(${coords.latitude}, ${coords.longitude}); true;`;
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
          style={({ pressed }) => [styles.topBarButton, styles.shadowButton, pressed && styles.buttonPressed]}
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

            if (msg === "Map created OK") {
              setMapReady(true);
            }

            if (msg === "USER_MOVED_MAP") {
              setIsMyLocationActive(false);
            }
          }}
        />

        {!coords && !errorMsg && (
          <View style={styles.overlay}>
            <ActivityIndicator />
            <Text style={styles.overlayText}>현재 위치 가져오는 중…</Text>
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
                {
                  backgroundColor: active ? c.bgActive : c.bg,
                },
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
    backgroundColor: "rgba(255, 255, 255, 0.9)",
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