import React from "react";
import { View, Text, StyleSheet, Dimensions, Image } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TEXT = "#2B2B2B";

/**
 * 산책 리뷰 1페이지: 목표 달성 + 산책 시간/거리
 */
export default function WalkReviewSlide1({ walkTime = "30m 12s", walkDistance = "1.2km" }) {
  return (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <View style={styles.graphicWrap}>
        <Image
          source={require("../assets/endScreen_bowl.png")}
          style={styles.graphicImage}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.title}>오늘의 목표를 달성했어요!</Text>
      <Text style={styles.stat}>산책 시간: {walkTime}</Text>
      <Text style={styles.stat}>산책 거리: {walkDistance}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  graphicWrap: {
    marginBottom: 4,
  },
  graphicImage: {
    width: 400,
    height: 240,
  },
  title: {
    fontSize: 27,
    fontWeight: "800",
    color: TEXT,
    marginBottom: 20,
    textAlign: "center",
  },
  stat: {
    fontSize: 16,
    color: TEXT,
    marginTop: 6,
  },
});
