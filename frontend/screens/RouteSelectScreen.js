//RouteSelectScreen.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import { API_BASE_URL } from "../config/config";
import { getAccessToken } from "../auth/authStorage"; 

const BROWN = "#8E6A3D";
const TEXT = "#2B2B2B";
const COURSE_BROWN = "#dbbc93ff";

const KAKAO_JS_KEY = "11d7dbc230380a0189daebce58d6ddb8";

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
    function send(msg) {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(String(msg));
    }

    var map = null;
    var myMarker = null;
    var markerImage = null;
    var routePolylines = [];
    var routeBounds = [];

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

    function clearRoutes() {
      for (var i = 0; i < routePolylines.length; i++) {
        var p = routePolylines[i];
        if (!p) continue;
        try { if (p.outline) p.outline.setMap(null); } catch (e) {}
        try { if (p.main) p.main.setMap(null); } catch (e) {}
      }
      routePolylines = [];
      routeBounds = [];
    }

    function buildBounds(path) {
      var bounds = new kakao.maps.LatLngBounds();
      for (var i = 0; i < path.length; i++) {
        bounds.extend(path[i]);
      }
      return bounds;
    }

    function thinCoords(coords, step) {
      if (!coords || coords.length <= 2) return coords || [];
      var out = [];
      for (var i = 0; i < coords.length; i += step) {
        out.push(coords[i]);
      }
      if (coords.length > 0) {
        out.push(coords[coords.length - 1]);
      }
      return out;
    }

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

      return { outline: outline, main: main };
    }

    function getRouteTheme(index) {
      var themes = [
        {
          normal: {
            outW: 8,
            outColor: "#FFFFFF",
            outOpacity: 0.9,
            mainW: 5,
            mainColor: "#E6A5A5",
            mainOpacity: 0.9,
          },
          selected: {
            outW: 10,
            outColor: "#FFFFFF",
            outOpacity: 0.95,
            mainW: 6,
            mainColor: "#D98C8C",
            mainOpacity: 0.96,
          },
        },
        {
          normal: {
            outW: 8,
            outColor: "#FFFFFF",
            outOpacity: 0.9,
            mainW: 5,
            mainColor: "#E8D89A",
            mainOpacity: 0.9,
          },
          selected: {
            outW: 10,
            outColor: "#FFFFFF",
            outOpacity: 0.95,
            mainW: 6,
            mainColor: "#D9C46F",
            mainOpacity: 0.96,
          },
        },
        {
          normal: {
            outW: 8,
            outColor: "#FFFFFF",
            outOpacity: 0.9,
            mainW: 5,
            mainColor: "#A9D3AD",
            mainOpacity: 0.9,
          },
          selected: {
            outW: 10,
            outColor: "#FFFFFF",
            outOpacity: 0.95,
            mainW: 6,
            mainColor: "#8CBF92",
            mainOpacity: 0.96,
          },
        },
      ];

      return themes[index] || themes[0];
    }

    window.setMyLocation = function(lat, lng) {
      try {
        if (!window.kakao || !kakao.maps || !map) {
          send("setMyLocation called but map not ready");
          return;
        }

        var pos = new kakao.maps.LatLng(lat, lng);
        map.setCenter(pos);

        if (!myMarker) {
          myMarker = new kakao.maps.Marker({
            position: pos,
            image: getDogMarkerImage(),
          });
          myMarker.setMap(map);
        } else {
          myMarker.setPosition(pos);
        }

        send("Location applied: " + lat + "," + lng);
      } catch (e) {
        send("setMyLocation error: " + e.message);
      }
    };

    window.setRoutes = function(routes) {
      try {
        if (!window.kakao || !kakao.maps || !map) {
          send("setRoutes called but map not ready");
          return;
        }

        clearRoutes();

        for (var i = 0; i < routes.length; i++) {
          var coords =
            routes[i] &&
            routes[i].geometry &&
            routes[i].geometry.coordinates
              ? routes[i].geometry.coordinates
              : [];

          coords = thinCoords(coords, 1);

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

          var theme = getRouteTheme(i);
          var stroke = makeStroke(path, theme.normal);

          stroke._path = path;
          stroke._styleNormal = theme.normal;
          stroke._styleSelected = theme.selected;

          routePolylines.push(stroke);
          routeBounds.push(buildBounds(path));
        }

        window.selectRoute(0);
        send("Routes set: " + routes.length);
      } catch (e) {
        send("setRoutes error: " + e.message);
      }
    };

    window.selectRoute = function(idx) {
      try {
        if (!window.kakao || !kakao.maps || !map) return;
        if (!routePolylines.length) return;

        for (var i = 0; i < routePolylines.length; i++) {
          var p = routePolylines[i];
          if (!p) continue;

          try { if (p.outline) p.outline.setMap(null); } catch (e) {}
          try { if (p.main) p.main.setMap(null); } catch (e) {}

          if (i === idx) {
            var stroke = makeStroke(p._path, p._styleSelected);
            p.outline = stroke.outline;
            p.main = stroke.main;

            p.outline.setMap(map);
            p.main.setMap(map);
          }
        }

        var b = routeBounds[idx];
        if (b) {
          map.setBounds(b);
        }
      } catch (e) {
        send("selectRoute error: " + e.message);
      }
    };

    window.onerror = function(message, source, lineno, colno) {
      send("JS ERROR: " + message + " @ " + lineno + ":" + colno);
    };
  </script>

  <script
    src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}"
    onload="window.ReactNativeWebView && window.ReactNativeWebView.postMessage('Kakao SDK loaded')"
    onerror="window.ReactNativeWebView && window.ReactNativeWebView.postMessage('Kakao SDK load FAILED')"
  ></script>

  <script>
    setTimeout(function() {
      if (!window.kakao || !kakao.maps) {
        window.ReactNativeWebView &&
          window.ReactNativeWebView.postMessage("kakao.maps not ready");
        return;
      }

      var container = document.getElementById("map");
      var options = {
        center: new kakao.maps.LatLng(37.5665, 126.9780),
        level: 4
      };

      map = new kakao.maps.Map(container, options);
      window.ReactNativeWebView &&
        window.ReactNativeWebView.postMessage("Map created OK");
    }, 200);
  </script>
</body>
</html>
`;

export default function RouteSelectScreen({ navigation, route }) {
  const minutes = route?.params?.minutes ?? 30;
  const selectedTags = route?.params?.selectedTags ?? [];

  const [selected, setSelected] = useState("A");
  const [coords, setCoords] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [recoRoutes, setRecoRoutes] = useState([]);
  const [loadingReco, setLoadingReco] = useState(false);
  const [recoError, setRecoError] = useState(null);

  const webviewRef = useRef(null);

  // ⭐ routes는 recoRoutes state 정의 후에!
  const routes = useMemo(() => {
    const base = [
      { id: "A", label: "코스 A", idx: 0 },
      { id: "B", label: "코스 B", idx: 1 },
      { id: "C", label: "코스 C", idx: 2 },
    ];

    return base.map((r) => ({
      ...r,
      fromDb: recoRoutes?.[r.idx]?.fromDb === true,
      matchScore: recoRoutes?.[r.idx]?.title?.match(/\d+/)?.[0] || null,
    }));
  }, [recoRoutes]);

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

  useEffect(() => {
    if (!coords || !mapReady || !webviewRef.current) return;

    const js = `
      window.setMyLocation(${coords.latitude}, ${coords.longitude});
      true;
    `;
    webviewRef.current.injectJavaScript(js);
  }, [coords, mapReady]);

  useEffect(() => {
    if (!coords) return;

    (async () => {
      try {
        setLoadingReco(true);
        setRecoError(null);

        const token = await getAccessToken();

        if (!token) {
          throw new Error("로그인 토큰이 없습니다. 다시 로그인해주세요.");
        }

        const res = await fetch(`${API_BASE_URL}/routes/recommend`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            start: { lat: coords.latitude, lng: coords.longitude },
            minutes,
            tags: selectedTags,
          }),
        });

        if (!res.ok) {
          const t = await res.text();
          throw new Error(`recommend failed: ${res.status} ${t}`);
        }

        const data = await res.json();
        const list = Array.isArray(data?.routes) ? data.routes : [];

        if (list.length === 0) {
          throw new Error("routes empty");
        }

        setRecoRoutes(list);
        console.log("RECO OK", list.length, list, "selectedTags:", selectedTags);
      } catch (e) {
        console.log("RECO ERROR", e?.message ?? e);
        setRecoError(e?.message ?? String(e));
      } finally {
        setLoadingReco(false);
      }
    })();
  }, [coords, minutes, selectedTags]);

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

  useEffect(() => {
    if (!mapReady || !webviewRef.current) return;
    if (!Array.isArray(recoRoutes) || recoRoutes.length === 0) return;

    const selectedIdx = routes.findIndex((r) => r.id === selected);
    const idx = selectedIdx >= 0 ? selectedIdx : 0;

    const js = `
      window.selectRoute(${idx});
      true;
    `;
    webviewRef.current.injectJavaScript(js);
  }, [selected, mapReady, recoRoutes, routes]);

  const selectedIdx = routes.findIndex((r) => r.id === selected);
  const safeSelectedIdx = selectedIdx >= 0 ? selectedIdx : 0;
  const selectedRoute = recoRoutes?.[safeSelectedIdx];

  const onStartWalk = () => {
    console.log("START WALK", {
      selected,
      minutes,
      selectedTags,
      coords,
      routeId: selectedRoute?.routeId ?? selectedRoute?.pathId,
      selectedRoute,
    });

    navigation.navigate("WalkMap", {
      selectedRoute: {
        ...selectedRoute,
        routeId: selectedRoute?.routeId ?? selectedRoute?.pathId,
      },
      minutes,
      selectedTags,
    });
  };

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
            console.log("[WebView]", msg);

            if (msg === "Map created OK") {
              setMapReady(true);
            }
          }}
        />

        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && styles.buttonPressed]}
            onPress={() => navigation.goBack()}
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={28} color={TEXT} />
          </Pressable>

          <Text style={styles.headerTitle}>코스 선택</Text>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.courseRow}>
          {routes.map((r) => {
            const on = r.id === selected;

            return (
              <View key={r.id} style={styles.chipWrapper}>
                {r.fromDb && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>🔥 인기</Text>
                  </View>
                )}

                <Pressable
                  style={({ pressed }) => [
                    styles.courseChip,
                    on && styles.courseChipOn,
                    on && styles.courseChipBorderOn,
                    r.fromDb && styles.courseChipPopular,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => setSelected(r.id)}
                  disabled={loadingReco}
                >
                  <Text style={[styles.courseChipText, on && styles.courseChipTextOn]}>
                    {r.label}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        {recoError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>추천 실패: {recoError}</Text>
            <Text style={styles.errorTextSmall}>
              (FastAPI 8000 포트가 켜져 있는지, /routes/recommend 응답이 오는지 확인)
            </Text>
          </View>
        ) : null}

        <Pressable
          style={({ pressed }) => [
            styles.startBtn,
            (loadingReco || !selectedRoute) && styles.startBtnDisabled,
            pressed && !(loadingReco || !selectedRoute) && styles.buttonPressed,
          ]}
          disabled={loadingReco || !selectedRoute}
          onPress={onStartWalk}
        >
          <Text style={styles.startText}>
            {loadingReco ? "코스 만드는 중..." : "산책 시작하기"}
          </Text>
        </Pressable>

        <View style={styles.dots}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },

  container: {
    flex: 1,
  },

  map: {
    flex: 1,
  },

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

  backBtn: {
    padding: 8,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: TEXT,
  },

  headerSpacer: {
    width: 28,
  },

  buttonPressed: {
    transform: [{ scale: 0.97 }],
  },

  courseRow: {
    position: "absolute",
    bottom: 160,
    left: 18,
    right: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    paddingTop: 20,
  },

  chipWrapper: {
    flex: 1,
    position: "relative",
  },

  popularBadge: {
    position: "absolute",
    top: -18,
    left: "50%",
    transform: [{ translateX: -30 }],
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    zIndex: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },

  popularBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
  },

  courseChip: {
    flex: 1,
    height: 44,
    borderRadius: 999,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.2,
    borderColor: "rgba(0,0,0,0.12)",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  courseChipOn: {
    backgroundColor: COURSE_BROWN,
    borderColor: COURSE_BROWN,
  },

  courseChipBorderOn: {
    borderWidth: 1.4,
    borderColor: "#b98954ff",
  },

  courseChipPopular: {
    borderWidth: 2,
    borderColor: "#FF6B6B",
  },

  courseChipText: {
    fontSize: 14,
    fontWeight: "900",
    color: TEXT,
  },

  courseChipTextOn: {
    color: "#fff",
  },

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

  errorText: {
    color: "#B00020",
    fontWeight: "900",
  },

  errorTextSmall: {
    marginTop: 6,
    color: "#B00020",
    fontSize: 12,
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
    elevation: 5,
  },

  startBtnDisabled: {
    opacity: 0.6,
  },

  startText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },

  dots: {
    position: "absolute",
    bottom: 26,
    flexDirection: "row",
    alignSelf: "center",
    gap: 10,
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  dotActive: {
    backgroundColor: "rgba(0,0,0,0.45)",
  },
});