//WalkControlBar.js
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const BROWN = "#8E6A3D";
const TEXT = "#2B2B2B";

/**
 * 산책 진행 중 하단 바: 일시정지 | 경과 시간/거리 | 산책 종료
 */
export default function WalkControlBar({ onEndWalk }) {
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);

  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
      setDistanceKm((d) => Math.round((d + 0.00017) * 100) / 100);
    }, 1000);
    return () => clearInterval(id);
  }, [isPaused]);

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <View style={styles.walkBar}>
      <Pressable style={styles.walkBarBtnWrap} onPress={() => setIsPaused((p) => !p)}>
        <View style={styles.walkBarCircleBtn}>
          <Ionicons
            name={isPaused ? "play" : "pause"}
            size={24}
            color="#fff"
          />
        </View>
        <Text style={styles.walkBarLabel}>
          {isPaused ? "재개" : "일시정지"}
        </Text>
      </Pressable>
      <View style={styles.walkBarCenter}>
        <Text style={styles.walkBarTime}>{formatTime(elapsedSeconds)}</Text>
        <Text style={styles.walkBarDistance}>{distanceKm.toFixed(1)}km</Text>
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