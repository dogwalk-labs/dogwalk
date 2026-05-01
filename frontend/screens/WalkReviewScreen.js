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
import { WALK_API_BASE_URL } from "../config/config";
import { getAccessToken } from "../auth/authStorage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BG = "#FBF3DD";

async function saveWalkAndFeedback(selectedRoute, walkStats, value, tags = []) {
  try {
    const token = await getAccessToken();

    if (!token) {
      throw new Error("로그인 토큰이 없습니다. 다시 로그인해주세요.");
    }

    console.log("API 호출:", `${WALK_API_BASE_URL}/feedback`);

    const res = await fetch(`${WALK_API_BASE_URL}/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        route: {
          ...selectedRoute,
          distanceM:
            Math.round((walkStats?.distanceKm ?? 0) * 1000) ||
            selectedRoute?.distanceM ||
            0,
          durationSec:
            walkStats?.elapsedSeconds ??
            selectedRoute?.durationSec ??
            0,
        },
        category: tags,
        liked: value === 1,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`feedback failed: ${res.status} ${errText}`);
    }

    const data = await res.json();
    console.log("저장 완료:", data, "tags:", tags);

    return data;
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
  const [selectedTags, setSelectedTags] = useState([]);

  const goToSlide = (index) => {
    scrollRef.current?.scrollTo({
      x: SCREEN_WIDTH * index,
      animated: true,
    });
  };

  const handleFeedback = (value) => {
    if (value === 1) {
      goToSlide(2);
    } else {
      saveWalkAndFeedback(selectedRoute, walkStats, -1, []);
      goToSlide(3);
    }
  };

  const handleSelectTags = (tags) => {
    setSelectedTags(tags);
    console.log("선택된 태그:", tags);
  };

  const handleConfirmTags = () => {
    saveWalkAndFeedback(selectedRoute, walkStats, 1, selectedTags);
    goToSlide(3);
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
          <WalkReviewSlide1
            walkTime={walkTime}
            walkDistance={walkDistance}
          />

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