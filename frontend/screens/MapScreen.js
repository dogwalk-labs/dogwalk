import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { View, ActivityIndicator, StyleSheet, Text, Pressable, Image } from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";

const KAKAO_JS_KEY = "c501500e882a8cc704505df42be58a40";

const makeHtml = () => `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    html, body, #map { margin:0; padding:0; width:100%; height:100%; }
  </style>
</head>
<body>
  <div id="map"></div>

  <script>
    var map = null;
    var myMarker = null;

    window.setMyLocation = function(lat, lng) {
      try {
        if (!window.kakao || !window.kakao.maps || !map) return;
        var pos = new kakao.maps.LatLng(lat, lng);
        map.setCenter(pos);
        if (!myMarker) {
          myMarker = new kakao.maps.Marker({ position: pos });
          myMarker.setMap(map);
        } else {
          myMarker.setPosition(pos);
        }
      } catch(e) {}
    };
  </script>

  <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}"
    onload="window.ReactNativeWebView?.postMessage('Kakao SDK loaded')"
    onerror="window.ReactNativeWebView?.postMessage('Kakao SDK load FAILED')">
  </script>

  <script>
    setTimeout(function() {
      if (!window.kakao || !window.kakao.maps) return;
      var container = document.getElementById('map');
      var options = { center: new kakao.maps.LatLng(37.5665, 126.9780), level: 3 };
      map = new kakao.maps.Map(container, options);
      window.ReactNativeWebView?.postMessage("Map created OK");
    }, 200);
  </script>
</body>
</html>
`;

const CATEGORY_CONFIG = [
  { key: "TOILET", label: "🗑️ 화장실", bg: "#F1F1F1", text: "#6B6B6B", bgActive: "#9A9A9A" },
  { key: "HOSPITAL", label: "🏥 동물 병원", bg: "#E8F6E8", text: "#2E8B57", bgActive: "#37A66A" },
  { key: "PET", label: "🍔 애견동반 식당", bg: "#FBE3E6", text: "#D4637A", bgActive: "#E06A84" },
];

const MOCK_STORES = [
  {
    id: "1",
    title: "멍멍 샐러드 단국대점",
    rating: 4.7,
    distanceM: 510,
    timeText: "도보 7분",
    img: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=60",
  },
  {
    id: "2",
    title: "따뜻한 빵집",
    rating: 4.4,
    distanceM: 830,
    timeText: "도보 11분",
    img: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=60",
  },
  {
    id: "3",
    title: "애견 동반 카페",
    rating: 4.8,
    distanceM: 1200,
    timeText: "도보 16분",
    img: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1200&q=60",
  },
];

export default function MapScreen({ navigation }) {
  const webviewRef = useRef(null);

  const [coords, setCoords] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [mapReady, setMapReady] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("TOILET");
  const [panelOpen, setPanelOpen] = useState(false);

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
          { accuracy: Location.Accuracy.High, timeInterval: 1000, distanceInterval: 2 },
          (loc) => setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude })
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
    setSelectedCategory(key);
    setPanelOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setPanelOpen(false);
  }, []);

  const activeLabel = useMemo(() => {
    const found = CATEGORY_CONFIG.find((c) => c.key === selectedCategory);
    if (!found) return "";
    return found.label.replace("🗑️ ", "").replace("🏥 ", "").replace("🍔 ", "");
  }, [selectedCategory]);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.img }} style={styles.cardImg} />
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardSub}>
        ⭐ {item.rating}  •  {item.distanceM}m ({item.timeText})
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable style={styles.topBarButton} onPress={() => navigation.navigate("TimeSelect")}>
          <Text style={styles.topBarText}>산책 갈 시간이다멍! 🐾</Text>
        </Pressable>
      </View>

      <View style={styles.mapContainer}>
        <WebView
          ref={webviewRef}
          style={styles.webview}
          originWhitelist={["*"]}
          javaScriptEnabled
          source={{ html: makeHtml(), baseUrl: "https://localhost" }}
          onMessage={(e) => {
            const msg = e.nativeEvent.data;
            if (msg === "Map created OK") setMapReady(true);
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
      </View>

      
      <View style={[styles.filterRow, panelOpen && { bottom: 320 }]}>
        {CATEGORY_CONFIG.map((c) => {
          const active = selectedCategory === c.key;
          return (
            <Pressable
              key={c.key}
              style={[styles.chip, { backgroundColor: active ? c.bgActive : c.bg }]}
              onPress={() => onSelectCategory(c.key)}
            >
              <Text style={[styles.chipText, { color: active ? "#FFFFFF" : c.text }]} numberOfLines={1}>
                {c.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

    
      {panelOpen && (
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelHeaderText}>근처 “{activeLabel}”이에요</Text>
            <Pressable onPress={closePanel} hitSlop={10}>
              <Text style={styles.closeText}>닫기</Text>
            </Pressable>
          </View>

          <View style={styles.listContent}>
            {MOCK_STORES.map((item) => (
              <View key={item.id}>{renderItem({ item })}</View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  topBar: {
    position: "absolute",
    top: 80,
    left: 20,
    right: 20,
    zIndex: 20,
  },
  topBarButton: {
    backgroundColor: "#fbf3ddff",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#d4c3acff",
  },
  topBarText: { fontSize: 16, fontWeight: "700", color: "#2B2B2B" },

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
    height: 40,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  chipText: { fontSize: 13, fontWeight: "800" },

  panel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 300,
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 10,
    zIndex: 30,
  },
  panelHeader: {
    paddingHorizontal: 18,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  panelHeaderText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2B2B2B",
  },
  closeText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#6B6B6B",
  },

  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 24,
    gap: 14,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
  },
  cardImg: {
    width: "100%",
    height: 140,
  },
  cardTitle: {
    marginTop: 10,
    paddingHorizontal: 10,
    fontSize: 15,
    fontWeight: "900",
    color: "#2B2B2B",
  },
  cardSub: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingBottom: 12,
    fontSize: 12,
    color: "#6B6B6B",
    fontWeight: "600",
  },
});