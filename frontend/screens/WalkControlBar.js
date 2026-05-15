//WalkControlBar.js
import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const BROWN = "#8E6A3D";
const TEXT = "#2B2B2B";

function calcDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function WalkControlBar({ onEndWalk, coords }) {
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const prevCoords = useRef(null);

  // 타이머
  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [isPaused]);

  // GPS 실제 거리 계산
  useEffect(() => {
    if (!coords || isPaused) return;

    if (prevCoords.current) {
      const d = calcDistanceKm(
        prevCoords.current.latitude,
        prevCoords.current.longitude,
        coords.latitude,
        coords.longitude
      );
      // GPS 오차 무시 (3m 이하)
      if (d > 0.003) {
        setDistanceKm((prev) => Math.round((prev + d) * 1000) / 1000);
      }
    }

    prevCoords.current = coords;
  }, [coords, isPaused]);

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <View style={styles.walkBar}>
      <Pressable
        style={styles.walkBarBtnWrap}
        onPress={() => setIsPaused((p) => !p)}
      >
        <View style={styles.walkBarCircleBtn}>
          <Ionicons name={isPaused ? "play" : "pause"} size={24} color="#fff" />
        </View>
        <Text style={styles.walkBarLabel}>
          {isPaused ? "재개" : "일시정지"}
        </Text>
      </Pressable>

      <View style={styles.walkBarCenter}>
        <Text style={styles.walkBarTime}>{formatTime(elapsedSeconds)}</Text>
        <Text style={styles.walkBarDistance}>{distanceKm.toFixed(2)}km</Text>
      </View>

      <Pressable
        style={styles.walkBarBtnWrap}
        onPress={() => onEndWalk({ elapsedSeconds, distanceKm })}
      >
        <View style={styles.walkBarCircleBtn}>
          <Ionicons name="stop" size={24} color="#fff" />
        </View>
        <Text style={styles.walkBarLabel}>산책 종료</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  walkBar: {
    position: "absolute",
    bottom: 110,
    left: 18,
    right: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f5f0e6",
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  walkBarBtnWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  walkBarCircleBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BROWN,
    alignItems: "center",
    justifyContent: "center",
  },
  walkBarLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: TEXT,
    marginTop: 6,
  },
  walkBarCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
  walkBarTime: {
    fontSize: 18,
    fontWeight: "900",
    color: TEXT,
  },
  walkBarDistance: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT,
    marginTop: 2,
    opacity: 0.85,
  },
});