
import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";

import { SERVER_HOST, API_BASE_URL } from "../config/config";
import { getAccessToken } from "../auth/authStorage";

const KAKAO_JS_KEY = "11d7dbc230380a0189daebce58d6ddb8";

const OSRM_BASE_URL = `http://${SERVER_HOST}:5000`;

const MIN_POINTS = 3;
const MAX_POINTS = 6;

const makeHtml = () => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0,
    maximum-scale=1.0, user-scalable=no"
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
    var markers = [];
    var routeLine = null;

    function sendMessage(data) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify(data)
      );
    }

    function initializeMap() {
      if (!window.kakao || !window.kakao.maps) {
        sendMessage({
          type: "ERROR",
          message: "카카오맵 SDK 로드 실패"
        });
        return;
      }

      var container = document.getElementById("map");

      map = new kakao.maps.Map(container, {
        center: new kakao.maps.LatLng(
          37.5665,
          126.9780
        ),
        level: 4
      });

      kakao.maps.event.addListener(
        map,
        "click",
        function(mouseEvent) {
          var latlng = mouseEvent.latLng;

          sendMessage({
            type: "MAP_CLICK",
            lat: latlng.getLat(),
            lng: latlng.getLng()
          });
        }
      );

      sendMessage({ type: "MAP_READY" });
    }

    window.setCenter = function(lat, lng) {
      if (!map) return;

      map.setCenter(
        new kakao.maps.LatLng(lat, lng)
      );
    };

    window.renderPoints = function(points) {
      if (!map) return;

      markers.forEach(function(marker) {
        marker.setMap(null);
      });

      markers = [];

      points.forEach(function(point, index) {
        var position = new kakao.maps.LatLng(
          point.lat,
          point.lng
        );

        var marker = new kakao.maps.Marker({
          position: position,
          map: map
        });

        var label = new kakao.maps.CustomOverlay({
          position: position,
          content:
            '<div style="' +
            'background:white;' +
            'border:1px solid #333;' +
            'border-radius:12px;' +
            'padding:3px 7px;' +
            'font-weight:bold;' +
            'font-size:12px;' +
            'transform:translateY(-42px);' +
            '">' +
            String.fromCharCode(65 + index) +
            '</div>',
          yAnchor: 1
        });

        label.setMap(map);

        markers.push(marker);
        markers.push(label);
      });
    };

    window.renderRoute = function(coordinates) {
      if (!map) return;

      if (routeLine) {
        routeLine.setMap(null);
        routeLine = null;
      }

      if (!coordinates || coordinates.length === 0) {
        return;
      }

      var path = coordinates.map(function(point) {
        return new kakao.maps.LatLng(
          point[1],
          point[0]
        );
      });

      routeLine = new kakao.maps.Polyline({
        map: map,
        path: path,
        strokeWeight: 6,
        strokeColor: "#1685DF",
        strokeOpacity: 0.9,
        strokeStyle: "solid"
      });

      var bounds = new kakao.maps.LatLngBounds();

      path.forEach(function(point) {
        bounds.extend(point);
      });

      map.setBounds(bounds);
    };

    window.clearRoute = function() {
      if (routeLine) {
        routeLine.setMap(null);
        routeLine = null;
      }
    };
  </script>

  <script
    src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false"
    onload="kakao.maps.load(initializeMap)"
    onerror="window.ReactNativeWebView.postMessage(JSON.stringify({
      type:'ERROR',
      message:'카카오맵 스크립트 로드 실패'
    }))"
  ></script>
</body>
</html>
`;

export default function RouteWaypointTestScreen({
  navigation,
}) {
  const webviewRef = useRef(null);
  const savingRef = useRef(false);

  const [mapReady, setMapReady] = useState(false);
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [routeInfo, setRouteInfo] = useState(null);
  const [routeGeometry, setRouteGeometry] = useState(null);
  const [routeTitle, setRouteTitle] = useState("추천 산책 코스");
  const [savedRoute, setSavedRoute] = useState(false);

  // WebView에 JavaScript 전달
  const inject = useCallback((script) => {
    webviewRef.current?.injectJavaScript(
      `${script}; true;`
    );
  }, []);

  // 경유점 변경 시 기존 경로 초기화
  const resetGeneratedRoute = useCallback(() => {
    inject("window.clearRoute()");
    setRouteInfo(null);
    setRouteGeometry(null);
    setSavedRoute(false);
  }, [inject]);

  const updatePoints = useCallback(
    (nextPoints) => {
      setPoints(nextPoints);

      inject(
        `window.renderPoints(${JSON.stringify(nextPoints)})`
      );

      resetGeneratedRoute();
    },
    [inject, resetGeneratedRoute]
  );

  // 카카오맵 메시지 수신
  const handleMapMessage = useCallback(
    (event) => {
      try {
        const data = JSON.parse(
          event.nativeEvent.data
        );

        if (data.type === "MAP_READY") {
          setMapReady(true);
          return;
        }

        if (data.type === "MAP_CLICK") {
          if (loading || savingRef.current) {
            return;
          }

          setPoints((prev) => {
            if (prev.length >= MAX_POINTS) {
              Alert.alert(
                "안내",
                "경유점은 최대 6개까지 선택할 수 있어요."
              );
              return prev;
            }

            const next = [
              ...prev,
              {
                lat: data.lat,
                lng: data.lng,
              },
            ];

            inject(
              `window.renderPoints(${JSON.stringify(next)})`
            );

            inject("window.clearRoute()");

            setRouteInfo(null);
            setRouteGeometry(null);
            setSavedRoute(false);

            return next;
          });
        }

        if (data.type === "ERROR") {
          Alert.alert("지도 오류", data.message);
        }
      } catch (error) {
        console.log("WebView message error:", error);
      }
    },
    [inject, loading]
  );

  // 현재 위치로 지도 이동
  const moveToMyLocation = async () => {
    try {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "위치 권한",
          "위치 접근 권한이 필요합니다."
        );
        return;
      }

      const location =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

      inject(
        `window.setCenter(
          ${location.coords.latitude},
          ${location.coords.longitude}
        )`
      );
    } catch (error) {
      Alert.alert(
        "오류",
        "현재 위치를 가져오지 못했습니다."
      );
    }
  };

  // OSRM 경로 생성
  const generateRoute = async () => {
    if (loading || savingRef.current) return;

    if (points.length < MIN_POINTS) {
      Alert.alert(
        "안내",
        "경유점을 최소 3개 선택해 주세요."
      );
      return;
    }

    try {
      setLoading(true);

      // 이전 경로 저장 정보 초기화
      setRouteInfo(null);
      setRouteGeometry(null);
      setSavedRoute(false);

      const loopPoints = [
        ...points,
        points[0],
      ];

      const coordinateString = loopPoints
        .map((p) => `${p.lng},${p.lat}`)
        .join(";");

      const url =
        `${OSRM_BASE_URL}/route/v1/foot/` +
        `${coordinateString}` +
        `?overview=full&geometries=geojson&steps=false`;

      console.log("OSRM URL:", url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `OSRM HTTP ${response.status}`
        );
      }

      const result = await response.json();

      if (
        result.code !== "Ok" ||
        !result.routes ||
        result.routes.length === 0
      ) {
        throw new Error(
          result.message || "경로 생성 실패"
        );
      }

      const route = result.routes[0];

      const geometry = route.geometry;

      if (
        !geometry ||
        geometry.type !== "LineString" ||
        !Array.isArray(geometry.coordinates) ||
        geometry.coordinates.length < 2
      ) {
        throw new Error(
          "OSRM 경로 좌표가 올바르지 않습니다."
        );
      }

      inject(
        `window.renderRoute(${JSON.stringify(
          geometry.coordinates
        )})`
      );

      // DB 저장에 사용할 전체 GeoJSON 보관
      setRouteGeometry(geometry);

      setRouteInfo({
        distance: route.distance,
        duration: route.duration,
      });

      console.log(
        "경로 생성 완료:",
        route.distance,
        route.duration
      );
    } catch (error) {
      console.error(
        "OSRM 경로 생성 실패:",
        error
      );

      Alert.alert(
        "경로 생성 실패",
        String(error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  // 관리자 제작 경로 DB 저장
  const saveRouteToDatabase = async () => {
    if (savingRef.current || saving) return;

    if (!routeGeometry || !routeInfo) {
      Alert.alert(
        "안내",
        "먼저 산책 경로를 생성해 주세요."
      );
      return;
    }

    if (savedRoute) {
      Alert.alert(
        "안내",
        "이미 저장한 경로입니다."
      );
      return;
    }

    const title = routeTitle.trim();

    if (!title) {
      Alert.alert(
        "안내",
        "코스 이름을 입력해 주세요."
      );
      return;
    }

    savingRef.current = true;
    setSaving(true);

    try {
      const token = await getAccessToken();

      if (!token) {
        throw new Error(
          "로그인 정보가 없습니다. 다시 로그인해 주세요."
        );
      }

      const payload = {
        title,
        distanceM: Math.max(
          1,
          Math.round(routeInfo.distance)
        ),
        durationSec: Math.max(
          1,
          Math.round(routeInfo.duration)
        ),
        geometry: routeGeometry,
      };

      const url = `${API_BASE_URL}/routes/curated`;

      console.log("관리자 경로 저장 요청:", url);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(
        () => ({})
      );

      if (!response.ok) {
        let message = "경로 저장에 실패했습니다.";

        if (typeof data.detail === "string") {
          message = data.detail;
        } else if (response.status === 403) {
          message =
            "관리자 권한이 없습니다. FastAPI .env의 관리자 UUID를 확인해 주세요.";
        } else if (response.status === 404) {
          message =
            "저장 API를 찾을 수 없습니다. FastAPI 서버와 라우터를 확인해 주세요.";
        } else {
          message = `서버 오류: HTTP ${response.status}`;
        }

        throw new Error(message);
      }

      if (!data.ok) {
        throw new Error(
          "서버에서 저장 성공 응답을 받지 못했습니다."
        );
      }

      setSavedRoute(true);

      console.log(
        "관리자 경로 저장 성공:",
        data.pathId
      );

      Alert.alert(
        "저장 완료",
        `"${title}" 코스가 Supabase에 저장되었습니다.`
      );
    } catch (error) {
      console.error(
        "관리자 경로 저장 오류:",
        error
      );

      Alert.alert(
        "DB 저장 실패",
        String(error.message || error)
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  // 마지막 경유점 삭제
  const removeLastPoint = () => {
    if (loading || savingRef.current) return;
    if (points.length === 0) return;

    updatePoints(points.slice(0, -1));
  };

  // 전체 초기화
  const clearAll = () => {
    if (loading || savingRef.current) return;

    updatePoints([]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>
            ← 돌아가기
          </Text>
        </Pressable>

        <Text style={styles.title}>
          🗺️ 나만의 산책 경로 테스트
        </Text>

        <Text style={styles.subtitle}>
          지도에서 경유점 3~6개를 선택하세요.
        </Text>
      </View>

      <WebView
        ref={webviewRef}
        style={styles.map}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        source={{
          html: makeHtml(),
          baseUrl: "https://localhost",
        }}
        onMessage={handleMapMessage}
      />

      <View style={styles.infoPanel}>
        <Text style={styles.pointCount}>
          선택한 경유점: {points.length} / 6
        </Text>

        {routeInfo && (
          <Text style={styles.routeInfo}>
            거리: {(routeInfo.distance / 1000).toFixed(2)}
            km
            {"  |  "}
            예상 시간: {Math.round(
              routeInfo.duration / 60
            )}분
          </Text>
        )}

        {loading && (
          <ActivityIndicator
            size="small"
            color="#1685DF"
          />
        )}

        <View style={styles.buttonRow}>
          <Pressable
            style={styles.secondaryButton}
            onPress={moveToMyLocation}
          >
            <Text style={styles.secondaryText}>
              📍 내 위치
            </Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={removeLastPoint}
            disabled={loading || saving}
          >
            <Text style={styles.secondaryText}>
              ↩ 하나 취소
            </Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={clearAll}
            disabled={loading || saving}
          >
            <Text style={styles.secondaryText}>
              초기화
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={[
            styles.generateButton,
            (
              loading ||
              saving ||
              !mapReady ||
              points.length < MIN_POINTS
            ) && styles.disabledButton,
          ]}
          onPress={generateRoute}
          disabled={
            loading ||
            saving ||
            !mapReady ||
            points.length < MIN_POINTS
          }
        >
          <Text style={styles.generateText}>
            {loading
              ? "경로 생성 중..."
              : "선택한 경유점으로 경로 생성"}
          </Text>
        </Pressable>

        {routeInfo && routeGeometry && (
          <View style={styles.saveSection}>
            <Text style={styles.saveLabel}>
              저장할 코스 이름
            </Text>

            <TextInput
              style={styles.titleInput}
              value={routeTitle}
              onChangeText={setRouteTitle}
              placeholder="예: 우리 동네 한 바퀴"
              maxLength={100}
              editable={!saving && !savedRoute}
            />

            <Pressable
              style={[
                styles.saveButton,
                (saving || savedRoute) &&
                  styles.disabledButton,
              ]}
              onPress={saveRouteToDatabase}
              disabled={saving || savedRoute}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {savedRoute
                    ? "✓ DB 저장 완료"
                    : "💾 DB에 경로 저장"}
                </Text>
              )}
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  header: {
    paddingTop: 50,
    paddingHorizontal: 18,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
  },

  backText: {
    fontSize: 14,
    color: "#1685DF",
    marginBottom: 10,
    fontWeight: "600",
  },

  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#222222",
  },

  subtitle: {
    fontSize: 13,
    color: "#777777",
    marginTop: 5,
  },

  map: {
    flex: 1,
  },

  infoPanel: {
    padding: 15,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },

  pointCount: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },

  routeInfo: {
    fontSize: 14,
    color: "#1685DF",
    fontWeight: "700",
    marginBottom: 10,
  },

  buttonRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },

  secondaryButton: {
    flex: 1,
    backgroundColor: "#F1F3F5",
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
  },

  secondaryText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#333333",
  },

  generateButton: {
    backgroundColor: "#1685DF",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  disabledButton: {
    backgroundColor: "#AAB8C4",
  },

  generateText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  saveSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    paddingTop: 12,
  },

  saveLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 7,
  },

  titleInput: {
    borderWidth: 1,
    borderColor: "#D5DDE5",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#222222",
    backgroundColor: "#FFFFFF",
    marginBottom: 10,
  },

  saveButton: {
    backgroundColor: "#22965F",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
