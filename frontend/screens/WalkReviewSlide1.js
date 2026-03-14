import React from "react";
import { View, Text, StyleSheet, Dimensions, Image } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const BG = "#FBF3DD";
const TEXT = "#2B2B2B";
const BROWN = "#B08B5A";

/**
 * 산책 리뷰 1페이지: 목표 달성 + 산책 시간/거리
 */
export default function WalkReviewSlide1({
  walkTime = "30m 12s",
  walkDistance = "1.2km",
}) {
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

      <View style={styles.statBox}>
        <Text style={styles.stat}>산책 시간: {walkTime}</Text>
        <Text style={styles.stat}>산책 거리: {walkDistance}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    width: "100%",
    backgroundColor: BG,
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
    fontSize: 26,
    fontWeight: "900",
    color: TEXT,
    lineHeight: 34,
    textAlign: "center",
    marginBottom: 20,
    transform: [{ translateY: -10 }],
  },

  statBox: {
    alignItems: "center",
    marginTop: 4,
  },

  stat: {
    fontSize: 18,
    fontWeight: "800",
    color: BROWN,
    marginTop: 8,
    textAlign: "center",
  },
});