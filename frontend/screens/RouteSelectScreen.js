import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, SafeAreaView, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import WalkControlBar from "./WalkControlBar";
import EndWalkConfirmScreen from "./EndWalkConfirmScreen";
import WalkReviewScreen from "./WalkReviewScreen";


const BROWN = "#8E6A3D";
const TEXT = "#2B2B2B";
const COURSE_BROWN = "#dbbc93ff"; 

// 카카오 JS 키(지금은 베타 코드 그대로 사용)
const KAKAO_JS_KEY = "c501500e882a8cc704505df42be58a40";

// WebView 안에서 실행될 HTML
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
    function send(msg) { window.ReactNativeWebView?.postMessage(msg); }

    var map = null;
    var myMarker = null;

    // ✅ RN이 좌표를 주입하면 내 위치로 이동 + 마커 표시
    window.setMyLocation = function(lat, lng) {
      try {
        if (!window.kakao || !kakao.maps || !map) {
          send("setMyLocation called but map not ready");
          return;
        }

        var pos = new kakao.maps.LatLng(lat, lng);

        // 지도 중심 이동
        map.setCenter(pos);

        // 마커 생성/업데이트
        if (!myMarker) {
          myMarker = new kakao.maps.Marker({ position: pos });
          myMarker.setMap(map);
        } else {
          myMarker.setPosition(pos);
        }

        send("Location applied: " + lat + "," + lng);
      } catch(e) {
        send("setMyLocation error: " + e.message);
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
    // 지도 초기 생성(일단 서울로) → 곧바로 RN에서 setMyLocation으로 덮어씀
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

  // 코스 A/B/C(지금은 UI용 목업)
  const routes = useMemo(
    () => [
      { id: "A", label: "코스 A" },
      { id: "B", label: "코스 B" },
      { id: "C", label: "코스 C" },
    ],
    []
  );

  const [selected, setSelected] = useState("A");
  const [walkStarted, setWalkStarted] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showWalkReview, setShowWalkReview] = useState(false);
  const [lastWalkStats, setLastWalkStats] = useState(null);

  // 내 위치
  const [coords, setCoords] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const webviewRef = useRef(null);

  // 1) 현재 위치 가져오기(한 번만)
  useEffect(() => {
    (async () => {
      try {
        const enabled = await Location.hasServicesEnabledAsync();
        if (!enabled) return;

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setCoords({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      } catch (e) {
        // 에러 처리 UI 추가 가능 필요
        console.log("location error:", e?.message ?? e);
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

  const onStartWalk = () => {
    console.log("START WALK", { selected, minutes, coords });
    setWalkStarted(true);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/*  지도(풀스크린) */}
        <WebView
          ref={webviewRef}
          style={styles.map}
          originWhitelist={["*"]}
          javaScriptEnabled
          source={{ html: makeHtml(), baseUrl: "https://localhost" }}
          onMessage={(e) => {
            const msg = e.nativeEvent.data;
            // console.log("[RouteSelect WebView]", msg);

            if (msg === "Map created OK") {
              setMapReady(true);
            }
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

        {/* 코스 A/B/C  */}
        {!walkStarted && (
          <>
            <View style={styles.courseRow}>
              {routes.map((r) => {
                const on = r.id === selected;
                return (
                  <Pressable
                    key={r.id}
                    style={[styles.courseChip, on && styles.courseChipOn]}
                    onPress={() => setSelected(r.id)}
                  >
                    <Text style={[styles.courseChipText, on && styles.courseChipTextOn]}>
                      {r.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* 산책 시작하기 버튼 */}
            <Pressable
              style={styles.startBtn}
              onPress={onStartWalk}
            >
              <Text style={styles.startText}>산책 시작하기</Text>
            </Pressable>
          </>
        )}

        {walkStarted && (
          <WalkControlBar
            onEndWalk={({ elapsedSeconds, distanceKm }) => {
              setLastWalkStats({ elapsedSeconds, distanceKm });
              setShowEndConfirm(true);
            }}
          />
        )}

        <Modal
          visible={showEndConfirm}
          animationType="slide"
          onRequestClose={() => setShowEndConfirm(false)}
        >
          <EndWalkConfirmScreen
            onClose={() => setShowEndConfirm(false)}
            onConfirm={() => {
              setWalkStarted(false);
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
          />
        </Modal>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: TEXT,
  },

  
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

 courseChipOn: {
  backgroundColor: COURSE_BROWN,
  borderColor: COURSE_BROWN,
},
  courseChipText: {
    fontSize: 14,
    fontWeight: "900",
    color: TEXT,
  },
  courseChipTextOn: {
    color: "#fff",
  },

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
  startText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
});
