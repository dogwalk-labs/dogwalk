import React from "react";
import { View, Text, StyleSheet, Pressable, Dimensions, Image } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TEXT = "#2B2B2B";

/**
 * 산책 리뷰 2페이지: 코스 평가 (좋아요 / 아쉬워요)
 */
export default function WalkReviewSlide2({ onLike, onDislike }) {
  return (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <View style={styles.graphicWrap}>
        <Image
          source={require("../assets/endScreen_star.png")}
          style={styles.graphicImage}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.title}>산책 코스를 평가해주세요</Text>
      <Pressable style={[styles.button, styles.likeBtn]} onPress={onLike}>
        <Text style={styles.buttonText}>좋아요</Text>
      </Pressable>
      <Pressable style={[styles.button, styles.dislikeBtn]} onPress={onDislike}>
        <Text style={styles.buttonText}>아쉬워요</Text>
      </Pressable>
      <Text style={styles.hint}>평가는 다음 코스 추천에 반영돼요!</Text>
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
    marginBottom: -20,
  },
  graphicImage: {
    width: 320,
    height: 210,
  },
  title: {
    fontSize: 27,
    fontWeight: "800",
    color: TEXT,
    marginBottom: 28,
    textAlign: "center",
  },
  button: {
    width: "100%",
    maxWidth: 280,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  likeBtn: {
    backgroundColor: "#f48fb1",
  },
  dislikeBtn: {
    backgroundColor: "#81d4fa",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  hint: {
    marginTop: 20,
    fontSize: 13,
    color: "#666",
    textAlign: "center",
  },
});
