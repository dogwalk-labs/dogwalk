import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  Pressable,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const BG = "#FBF3DD";
const TEXT = "#2B2B2B";
const BROWN = "#B08B5A";

export default function OnboardingSlide2({ onNextPress }) {
  return (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <View style={styles.heroBox}>
        <Image
          source={require("../../assets/onboardingPage_foot.png")}
          style={styles.iconFoot}
          resizeMode="contain"
        />
      </View>

      <View style={styles.titleBox}>
        <Text style={styles.title}>
          반려동물과{"\n"}
          함께 걷기 좋은 코스를{"\n"}
          추천해줄게요!
        </Text>
      </View>

      <View style={styles.buttonArea}>
        <Pressable
          onPress={onNextPress}
          style={({ pressed }) => [
            styles.nextButton,
            pressed && styles.nextButtonPressed,
          ]}
        >
          <Text style={styles.nextButtonText}>다음</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    width: "100%",
    backgroundColor: BG,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 130,
  },

  heroBox: {
    width: "100%",
    height: 300,
    alignItems: "center",
    justifyContent: "flex-end",
  },

  iconFoot: {
    width: 300,
    height: 200,
    transform: [{ translateY: 0 }],
  },

  titleBox: {
    width: "100%",
    minHeight: 95,
    marginTop: -2,
    alignItems: "center",
    justifyContent: "flex-start",
  },

  title: {
    textAlign: "center",
    fontSize: 26,
    fontWeight: "900",
    color: TEXT,
    lineHeight: 36,
    marginTop: 15,
  },

  buttonArea: {
    position: "absolute",
    left: 22,
    right: 22,
    bottom: 150,
  },

  nextButton: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    backgroundColor: BROWN,
    alignItems: "center",
    justifyContent: "center",
  },

  nextButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },

  nextButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
});