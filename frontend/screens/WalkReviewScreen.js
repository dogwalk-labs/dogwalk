import React, { useRef, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  SafeAreaView,
} from "react-native";
import WalkReviewSlide1 from "./WalkReviewSlide1";
import WalkReviewSlide2 from "./WalkReviewSlide2";
import WalkReviewSlide3 from "./WalkReviewSlide3";
import WalkReviewSlide4 from "./WalkReviewSlide4";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BG = "#FBF3DD";

const API_BASE_URL = "http://192.168.0.20:8000";
const TEMP_USER_ID = "11111111-1111-1111-1111-111111111111";

async function saveWalkAndFeedback(selectedRoute, walkStats, value) {
  try {
    console.log("API 호출:", `${API_BASE_URL}/paths`);

    const pathRes = await fetch(`${API_BASE_URL}/paths`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: TEMP_USER_ID,
        minutes: selectedRoute?.minutes ?? 30,
        distance_m:
          Math.round((walkStats?.distanceKm ?? 0) * 1000) ||
          selectedRoute?.distanceM ||
          0,
        duration_sec:
          walkStats?.elapsedSeconds ?? selectedRoute?.durationSec ?? 0,
        geometry: selectedRoute?.geometry ?? null,
      }),
    });

    const pathData = await pathRes.json();
    const pathId = pathData?.pathId;
    if (!pathId) throw new Error("pathId 없음");

    await fetch(`${API_BASE_URL}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: TEMP_USER_ID,
        path_id: pathId,
        value,
      }),
    });

    console.log("저장 완료 pathId:", pathId);
  } catch (e) {
    console.log("저장 실패:", e?.message ?? e);
  }
}

export default function WalkReviewScreen({
  onGoHome,
  walkTime = "30m 12s",
  walkDistance = "1.2km",
  selectedRoute,
  walkStats,
}) {
  const scrollRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onScroll = (e) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / SCREEN_WIDTH);
    if (index !== currentIndex) setCurrentIndex(index);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContent}
        >
          <WalkReviewSlide1
            walkTime={walkTime}
            walkDistance={walkDistance}
          />

          <WalkReviewSlide2
            onLike={() => saveWalkAndFeedback(selectedRoute, walkStats, 1)}
            onDislike={() => saveWalkAndFeedback(selectedRoute, walkStats, -1)}
          />

          <WalkReviewSlide3 />

          <WalkReviewSlide4 onGoHome={onGoHome} />
        </ScrollView>

        <View style={styles.dots}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[styles.dot, i === currentIndex && styles.dotActive]}
            />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  scrollContent: {
    backgroundColor: BG,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingBottom: 40,
    backgroundColor: BG,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ccc",
  },
  dotActive: {
    backgroundColor: "#2B2B2B",
  },
});