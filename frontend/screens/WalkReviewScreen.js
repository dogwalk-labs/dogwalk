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

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BG = "#FBF3DD";

/**
 * 산책 종료 후 리뷰 플로우: 3개 슬라이드 가로 스와이프 + 페이지 인디케이터
 */
export default function WalkReviewScreen({
  onGoHome,
  walkTime = "30m 12s",
  walkDistance = "1.2km",
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
          <WalkReviewSlide1 walkTime={walkTime} walkDistance={walkDistance} />
          <WalkReviewSlide2 onLike={() => {}} onDislike={() => {}} />
          <WalkReviewSlide3 onGoHome={onGoHome} />
        </ScrollView>

        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
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