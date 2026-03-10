import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Image,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const BG = "#FBF3DD";
const BROWN = "#B08B5A";
const TEXT = "#2B2B2B";

/**
 * 산책 리뷰 3페이지: 다음 산책 때 또 만나요 + 홈으로 버튼
 */
export default function WalkReviewSlide3({ onGoHome }) {
  return (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <View style={styles.graphicWrap}>
        <Image
          source={require("../assets/endScreen_footprint.png")}
          style={styles.graphicImage}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>
        다음 산책 때{"\n"}또 만나요!
      </Text>

      <Pressable
        style={({ pressed }) => [
          styles.homeButton,
          pressed && styles.homeButtonPressed,
        ]}
        onPress={onGoHome}
      >
        <Text style={styles.homeButtonText}>홈으로</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  graphicWrap: {
    marginBottom: -10,
  },

  graphicImage: {
    width: 400,
    height: 240,
  },

  title: {
    fontSize: 26,
    fontWeight: "900",
    color: TEXT,
    textAlign: "center",
    lineHeight: 34,
    marginBottom: 40,
  },

  homeButton: {
    width: "100%",
    maxWidth: 340,
    height: 68,
    backgroundColor: BROWN,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  homeButtonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },

  homeButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
  },
});