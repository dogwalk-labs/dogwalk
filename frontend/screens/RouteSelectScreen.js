// frontend/screens/RouteSelectScreen.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, SafeAreaView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";

const BROWN = "#8E6A3D";
const TEXT = "#2B2B2B";
const COURSE_BROWN = "#dbbc93ff";

// ✅ 카카오 JS 키
const KAKAO_JS_KEY = process.env.REACT_APP_KAKAO_JS_KEY;

// ✅ 형님 PC IP로 바꾸기 (폰 Expo Go면 localhost 절대 X)
// 예: "http://192.168.0.12:8080"
const API_BASE_URL = "http://192.168.35.235:8080"; // <- 여기 바꿔!

/**
 * WebView HTML
 * - setMyLocation(lat,lng): 내 위치 마커
 * - setRoutes(routes): routes[0..2] 폴리라인 생성(아웃라인+본선)
 * - selectRoute(idx): idx 하나만 표시 + bounds 맞춤
 */
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
    function send(msg) { window.ReactNativeWebView?.postMessage(String(msg)); }

    var map = null;
    var myMarker = null;

    // ✅ routePolylines: [{outline, main, _path, _styleNormal, _styleSelected}, ...]
    var routePolylines = [];
    var routeBounds = [];

// ++여기부터 추가

    function clearRoutes() {
      for (var i = 0; i < routePolylines.length; i++) {
        var p = routePolylines[i];
        if (!p) continue;
        try { p.outline?.setMap(null); } catch(e) {}
        try { p.main?.setMap(null); } catch(e) {}
      }
      routePolylines = [];
      routeBounds = [];
    }

    function buildBounds(path) {
      var bounds = new kakao.maps.LatLngBounds();
      for (var i = 0; i < path.length; i++) bounds.extend(path[i]);
      return bounds;
    }

    // ✅ 점 너무 많으면 지저분해져서 줄임 (간단 thinning)
    function thinCoords(coords, step) {
      if (!coords || coords.length <= 2) return coords || [];
      var out = [];
      for (var i = 0; i < coords.length; i += step) out.push(coords[i]);
      out.push(coords[coords.length - 1]); // 마지막 점 포함
      return out;
    }

    // ✅ 아웃라인+본선 세트 생성
    function makeStroke(path, opts) {
      var outline = new kakao.maps.Polyline({
        path: path,
        strokeWeight: opts.outW,
        strokeColor: opts.outColor,
        strokeOpacity: opts.outOpacity,
        strokeStyle: "solid",
      });

      var main = new kakao.maps.Polyline({
        path: path,
        strokeWeight: opts.mainW,
        strokeColor: opts.mainColor,
        strokeOpacity: opts.mainOpacity,
        strokeStyle: "solid",
      });

      outline.setMap(null);
      main.setMap(null);

      return { outline, main };
    }

    // ✅ RN이 좌표를 주입하면 내 위치로 이동 + 마커 표시
    window.setMyLocation = function(lat, lng) {
      try {
        if (!window.kakao || !kakao.maps || !map) {
          send("setMyLocation called but map not ready");
          return;
        }

        var pos = new kakao.maps.LatLng(lat, lng);
        map.setCenter(pos); //지도 중심 이동

        if (!myMarker) { //마커 생성/업데이트
          myMarker = new kakao.maps.Marker({ position: pos });
          myMarker.setMap(map);
        } else {
          myMarker.setPosition(pos);
        }
      } catch(e) {
        send("setMyLocation error: " + e.message);
      }
    };

    // ✅ RN이 routes(GeoJSON coordinates)를 주입하면: 폴리라인 3개 생성
    // routes: [{ geometry: { coordinates: [[lng,lat], ...] }, ... }, ...]
    window.setRoutes = function(routes) {
      try {
        if (!window.kakao || !kakao.maps || !map) {
          send("setRoutes called but map not ready");
          return;
        }
        clearRoutes();

        // ++추가 ✅ 산책앱 느낌(브라운+화이트 아웃라인)
        var styleNormal = {
          outW: 10,
          outColor: "#FFFFFF",
          outOpacity: 0.95,
          mainW: 7,
          mainColor: "${BROWN}",
          mainOpacity: 0.92,
        };

        // 선택된 루트는 살짝 더 선명/굵게
        var styleSelected = {
          outW: 12,
          outColor: "#FFFFFF",
          outOpacity: 0.98,
          mainW: 8,
          mainColor: "${BROWN}",
          mainOpacity: 0.98,
        };

        for (var i = 0; i < routes.length; i++) {
          var coords = routes[i]?.geometry?.coordinates || [];

          // ✅ 점 줄이기 (4~6 사이 취향대로)
          coords = thinCoords(coords, 4);

          var path = [];
          for (var j = 0; j < coords.length; j++) {
            var lng = coords[j][0];
            var lat = coords[j][1];
            if (typeof lat === "number" && typeof lng === "number") {
              path.push(new kakao.maps.LatLng(lat, lng));
            }
          }

          if (path.length < 2) {
            routePolylines.push(null);
            routeBounds.push(null);
            continue;
          }

          // 일단 normal 스타일로 만들어두고, 선택 시 selected 스타일로 재생성
          var stroke = makeStroke(path, styleNormal);
          stroke._path = path;
          stroke._styleNormal = styleNormal;
          stroke._styleSelected = styleSelected;

          routePolylines.push(stroke);
          routeBounds.push(buildBounds(path));
        }

        window.selectRoute(0);
        send("Routes set: " + routes.length);
      } catch(e) {
        send("setRoutes error: " + e.message);
      }
    };

    // ✅ 특정 코스만 표시
    window.selectRoute = function(idx) {
      try {
        if (!window.kakao || !kakao.maps || !map) return;
        if (!routePolylines.length) return;

        for (var i = 0; i < routePolylines.length; i++) {
          var p = routePolylines[i];
          if (!p) continue;

          // 기존 선 제거
          try { p.outline?.setMap(null); } catch(e) {}
          try { p.main?.setMap(null); } catch(e) {}

          if (i === idx) {
            // 선택된 루트: selected 스타일로 재생성해서 표시
            var stroke = makeStroke(p._path, p._styleSelected);
            p.outline = stroke.outline;
            p.main = stroke.main;

            p.outline.setMap(map);
            p.main.setMap(map);
          }
        }

        var b = routeBounds[idx];
        if (b) map.setBounds(b);
      } catch(e) {
        send("selectRoute error: " + e.message);
      }
    };

    window.onerror = function(message, source, lineno, colno) {
      send("JS ERROR: " + message + " @ " + lineno + ":" + colno);
    };
  </script>

  <script
    src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}"
    onload="window.ReactNativeWebView?.postMessage('Kakao SDK loaded')"
    onerror="window.ReactNativeWebView?.postMessage('Kakao SDK load FAILED')"
  ></script>

  <script>
    setTimeout(function() {
      if (!window.kakao || !kakao.maps) {
        window.ReactNativeWebView?.postMessage("kakao.maps not ready");
        return;
      }

      var container = document.getElementById('map');
      var options = {
        center: new kakao.maps.LatLng(37.5665, 126.9780),
        level: 4
      };

      map = new kakao.maps.Map(container, options);
      window.ReactNativeWebView?.postMessage("Map created OK");
    }, 200);
  </script>
</body>
</html>
`;

export default function RouteSelectScreen({ navigation, route }) {
  const minutes = route?.params?.minutes ?? 30;

  const chips = useMemo(
    () => [
      { id: "A", label: "코스 A", idx: 0 },
      { id: "B", label: "코스 B", idx: 1 },
      { id: "C", label: "코스 C", idx: 2 },
    ],
    []
  );

  const [selected, setSelected] = useState("A");

  const [coords, setCoords] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const webviewRef = useRef(null);

//++추가
  const [recoRoutes, setRecoRoutes] = useState([]); //추천 경로 목록 저장하는 상태
  const [loadingReco, setLoadingReco] = useState(false); //추천 경로 요청 중인지 여부
  const [recoError, setRecoError] = useState(null);

  // 1) 현재 위치 가져오기
  useEffect(() => {
    (async () => {
      try {
        const enabled = await Location.hasServicesEnabledAsync();
        if (!enabled) {
          Alert.alert("위치 서비스 꺼짐", "휴대폰 위치 서비스를 켜줘.");
          return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("권한 필요", "위치 권한을 허용해야 경로 추천이 가능해.");
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setCoords({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      } catch (e) {
        console.log("location error:", e?.message ?? e);
        Alert.alert("위치 오류", "현재 위치를 가져오지 못했어.");
      }
    })();
  }, []);

  // 2) 지도 준비 + coords 생기면 WebView에 주입해서 내 위치로 이동
  useEffect(() => {
    if (!coords || !mapReady || !webviewRef.current) return;

    const js = `
      window.setMyLocation(${coords.latitude}, ${coords.longitude});
      true;
    `;
    webviewRef.current.injectJavaScript(js);
  }, [coords, mapReady]);

  // 3) ✅coords 생기면 추천 API 호출 (recoRoutes->지도 그리기)
  useEffect(() => {
    if (!coords) return;

    (async () => {
      try {
        setLoadingReco(true);
        setRecoError(null);

        const res = await fetch(`${API_BASE_URL}/recommend`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            start: { lat: coords.latitude, lng: coords.longitude },
            minutes,
            bannedRouteIds: [],
          }),
        });

        if (!res.ok) {
          const t = await res.text();
          throw new Error(`recommend failed: ${res.status} ${t}`);
        }

        const data = await res.json();
        const list = Array.isArray(data?.routes) ? data.routes : [];

        if (list.length === 0) throw new Error("routes empty");

        setRecoRoutes(list);
        console.log("RECO OK", list.length);
      } catch (e) {
        console.log("RECO ERROR", e?.message ?? e);
        setRecoError(e?.message ?? String(e));
      } finally {
        setLoadingReco(false);
      }
    })();
  }, [coords, minutes]);

  // 4) 추천 routes 받으면 WebView에 routes 주입
  useEffect(() => {
    if (!mapReady || !webviewRef.current) return;
    if (!Array.isArray(recoRoutes) || recoRoutes.length === 0) return;

    const payload = JSON.stringify(recoRoutes);
    const js = `
      window.setRoutes(${payload});
      true;
    `;
    webviewRef.current.injectJavaScript(js);
  }, [recoRoutes, mapReady]);

  // 5) 코스 선택 시 해당 루트 표시
  useEffect(() => {
    if (!mapReady || !webviewRef.current) return;
    if (!Array.isArray(recoRoutes) || recoRoutes.length === 0) return;

    const chip = chips.find((c) => c.id === selected);
    const idx = chip?.idx ?? 0;

    const js = `
      window.selectRoute(${idx});
      true;
    `;
    webviewRef.current.injectJavaScript(js);
  }, [selected, mapReady, recoRoutes, chips]);

  const selectedIdx = chips.find((c) => c.id === selected)?.idx ?? 0;
  const selectedRoute = recoRoutes?.[selectedIdx];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <WebView
          ref={webviewRef}
          style={styles.map}
          originWhitelist={["*"]}
          javaScriptEnabled
          source={{ html: makeHtml(), baseUrl: "https://localhost" }}
          onMessage={(e) => {
            const msg = e.nativeEvent.data;
            // 필요하면 켜기: console.log("[RouteSelect WebView]", msg);
            if (msg === "Map created OK") setMapReady(true);
          }}
        />

        {/* 상단바 */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="chevron-back" size={28} color={TEXT} />
          </Pressable>
          <Text style={styles.headerTitle}>코스 선택</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* 코스 A/B/C */}
        <View style={styles.courseRow}>
          {chips.map((r) => {
            const on = r.id === selected;
            return (
              <Pressable
                key={r.id}
                style={[styles.courseChip, on && styles.courseChipOn]}
                onPress={() => setSelected(r.id)}
                disabled={loadingReco}
              >
                <Text style={[styles.courseChipText, on && styles.courseChipTextOn]}>
                  {r.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* 추천 에러 표시 */}
        {recoError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>추천 실패: {recoError}</Text>
            <Text style={styles.errorTextSmall}>
              (API_BASE_URL이 PC IP로 맞는지, 서버(8080) 켜져있는지 확인)
            </Text>
          </View>
        ) : null}

        {/* 산책 시작하기 */}
        <Pressable
          style={[styles.startBtn, (loadingReco || !selectedRoute) && { opacity: 0.6 }]}
          disabled={loadingReco || !selectedRoute}
          onPress={() => {
            console.log("START WALK", {
              selected,
              minutes,
              coords,
              routeId: selectedRoute?.routeId,
            });

            // navigation.navigate("WalkScreen", { route: selectedRoute, start: coords, minutes });
          }}
        >
          <Text style={styles.startText}>{loadingReco ? "코스 만드는 중..." : "산책 시작하기"}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1 },
  map: { flex: 1 },

  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "900", color: TEXT },

  courseRow: {
    position: "absolute",
    bottom: 150,
    left: 18,
    right: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  courseChip: {
    flex: 1,
    height: 44,
    borderRadius: 999,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
  },
  courseChipOn: { backgroundColor: COURSE_BROWN, borderColor: COURSE_BROWN },
  courseChipText: { fontSize: 14, fontWeight: "900", color: TEXT },
  courseChipTextOn: { color: "#fff" },

  errorBox: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 230,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,0,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,0,0,0.15)",
  },
  errorText: { color: "#B00020", fontWeight: "900" },
  errorTextSmall: { marginTop: 6, color: "#B00020", fontSize: 12 },

  startBtn: {
    position: "absolute",
    bottom: 70,
    left: 18,
    right: 18,
    height: 64,
    borderRadius: 18,
    backgroundColor: BROWN,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  startText: { color: "#fff", fontSize: 18, fontWeight: "900" },
});