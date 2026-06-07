// WalkReviewScreen.js
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
import { API_BASE_URL } from "../../config/config";
import { getAccessToken } from "../../auth/authStorage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BG = "#FBF3DD";

async function saveWalkAndFeedback(selectedRoute, walkStats, value, tags = []) {
  try {
    console.log("### saveWalkAndFeedback 시작");

    const token = await getAccessToken();

    if (!token) {
      throw new Error("로그인 토큰이 없습니다. 다시 로그인해주세요.");
    }

    const distanceM =
      Math.round((walkStats?.distanceKm ?? 0) * 1000) ||
      selectedRoute?.distanceM ||
      0;

    const durationSec =
      walkStats?.elapsedSeconds && walkStats.elapsedSeconds > 60
        ? walkStats.elapsedSeconds
        : selectedRoute?.durationSec ?? 0;


    const pathPayload = {
      minutes: selectedRoute?.minutes ?? 30,
      distance_m: distanceM,
      duration_sec: durationSec,
      actual_distance_m: Math.round((walkStats?.distanceKm ?? 0) * 1000),
      actual_duration_sec: walkStats?.elapsedSeconds ?? 0,
      geometry: selectedRoute?.geometry
        ? {
            type: "LineString",
            coordinates: selectedRoute.geometry.coordinates,
          }
        : null,
      meta: {
        title: selectedRoute?.title,
        traits: selectedRoute?.traits,
        explanation: selectedRoute?.explanation,
        deg: selectedRoute?.deg,
        loopRadiusM: selectedRoute?.loopRadiusM,
      },
      route_id: selectedRoute?.routeId,
    };

    console.log("PATH API 호출:", `${API_BASE_URL}/paths`);

    const pathRes = await fetch(`${API_BASE_URL}/paths`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(pathPayload),
    });

    const pathText = await pathRes.text();

    if (!pathRes.ok) {
      throw new Error(`path save failed: ${pathRes.status} ${pathText}`);
    }

    const pathData = JSON.parse(pathText);
    const pathId = pathData.pathId;

    if (!pathId) {
      throw new Error("pathId를 받지 못했습니다.");
    }

    const feedbackPayload = {
      path_id: pathId,
      value,
      tags,
    };

    console.log("FEEDBACK API 호출:", `${API_BASE_URL}/feedback`);
    console.log("feedbackPayload:", feedbackPayload);

    const feedbackRes = await fetch(`${API_BASE_URL}/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(feedbackPayload),
    });

    const feedbackText = await feedbackRes.text();

    if (!feedbackRes.ok) {
      throw new Error(`feedback failed: ${feedbackRes.status} ${feedbackText}`);
    }

    const feedbackData = JSON.parse(feedbackText);
    console.log("저장 완료:", feedbackData, "tags:", tags);

    return feedbackData;
  } catch (e) {
    console.log("저장 실패:", e?.message ?? e);
    return null;
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
  const [selectedTags, setSelectedTags] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const goToSlide = (index) => {
    scrollRef.current?.scrollTo({
      x: SCREEN_WIDTH * index,
      animated: true,
    });
  };

  const handleFeedback = async (value) => {
    console.log("### 피드백 버튼 눌림:", value, "isSaving:", isSaving);

    if (isSaving) return;

    if (value === 1) {
      goToSlide(2);
      return;
    }

    try {
      setIsSaving(true);
      await saveWalkAndFeedback(selectedRoute, walkStats, -1, []);
      goToSlide(3);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectTags = (tags) => {
    setSelectedTags(tags);
    console.log("선택된 태그:", tags);
  };

  const handleConfirmTags = async () => {
    console.log("### 확인 버튼 눌림");
    console.log("isSaving:", isSaving);
    console.log("selectedRoute:", selectedRoute);

    if (isSaving) return;

    try {
      setIsSaving(true);
      await saveWalkAndFeedback(selectedRoute, walkStats, 1, selectedTags);
      goToSlide(3);
    } finally {
      setIsSaving(false);
    }
  };

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
          <WalkReviewSlide1 walkTime={walkTime} walkDistance={walkDistance} />

          <WalkReviewSlide2
            onLike={() => handleFeedback(1)}
            onDislike={() => handleFeedback(-1)}
          />

          <WalkReviewSlide3
            onSelectTags={handleSelectTags}
            onConfirm={handleConfirmTags}
          />

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