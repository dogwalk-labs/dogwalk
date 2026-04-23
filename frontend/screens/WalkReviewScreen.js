//WalkReviewScreen.js
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
import { API_BASE_URL } from "../config/config";
import { getAccessToken } from "../auth/authStorage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BG = "#FBF3DD";

// ⭐ value와 tags를 모두 받도록 수정
async function saveWalkAndFeedback(selectedRoute, walkStats, value, tags = []) {
  try {
    const token = await getAccessToken();

    if (!token) {
      throw new Error("로그인 토큰이 없습니다. 다시 로그인해주세요.");
    }

    console.log("API 호출:", `${API_BASE_URL}/paths`);

    const pathRes = await fetch(`${API_BASE_URL}/paths`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        minutes: selectedRoute?.minutes ?? 30,
        distance_m:
          Math.round((walkStats?.distanceKm ?? 0) * 1000) ||
          selectedRoute?.distanceM ||
          0,
        duration_sec:
          walkStats?.elapsedSeconds ?? selectedRoute?.durationSec ?? 0,
        geometry: selectedRoute?.geometry ?? null,
        route_id: selectedRoute?.routeId ?? null,  // ⭐ 추가!
      }),
    });

    if (!pathRes.ok) {
      const errText = await pathRes.text();
      throw new Error(`paths failed: ${pathRes.status} ${errText}`);
    }

    const pathData = await pathRes.json();
    const pathId = pathData?.pathId;
    if (!pathId) throw new Error("pathId 없음");

    const feedbackRes = await fetch(`${API_BASE_URL}/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        path_id: pathId,
        value,
        tags,
      }),
    });

    if (!feedbackRes.ok) {
      const errText = await feedbackRes.text();
      throw new Error(`feedback failed: ${feedbackRes.status} ${errText}`);
    }

    console.log("저장 완료 pathId:", pathId, "tags:", tags);
    return pathId;
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

  // ⭐ 사용자가 선택한 태그들을 저장
  const [selectedTags, setSelectedTags] = useState([]);

  const goToSlide = (index) => {
    scrollRef.current?.scrollTo({
      x: SCREEN_WIDTH * index,
      animated: true,
    });
  };

  // ⭐ 좋아요/아쉬워요 핸들러
  const handleFeedback = (value) => {
    if (value === 1) {
      // 👍 좋아요: 일단 슬라이드3(카테고리)으로 이동만
      // 저장은 카테고리 선택 후 Slide4로 넘어갈 때
      goToSlide(2);
    } else {
      // 👎 아쉬워요: 바로 저장하고 마지막 화면으로
      saveWalkAndFeedback(selectedRoute, walkStats, -1, []);
      goToSlide(3);
    }
  };

  // ⭐ Slide3에서 태그 선택 시 호출됨
  const handleSelectTags = (tags) => {
    setSelectedTags(tags);
    console.log("선택된 태그:", tags);
  };

  // ⭐ 카테고리 선택 완료하고 다음으로 넘어가는 함수
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
            onConfirm={handleConfirmTags}  // ⭐ 확인 버튼 콜백 전달
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