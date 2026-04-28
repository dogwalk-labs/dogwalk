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

export default function OnboardingSlide1({ onNextPress }) {
  return (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <View style={styles.heroBox}>
        <Image
          source={require("../assets/onboardingPage_dog.png")}
          style={styles.iconDog}
          resizeMode="contain"
        />
      </View>

      <View style={styles.titleBox}>
        <Text style={styles.title}>
          오늘 산책{"\n"}어디로 갈까?
        </Text>
      </View>

      <View style={styles.buttonArea}>
        <Pressable
          onPress={onNextPress}
          style={({ pressed }) => [styles.nextButton, pressed && styles.nextButtonPressed]}
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
  },

  heroBox: {
    width: "100%",
    height: 340,
    alignItems: "center",
    justifyContent: "flex-end",
  },

  iconDog: {
    width: 320,
    height: 320,
    transform: [{ translateY: 25 }],
  },

  titleBox: {
    width: "100%",
    minHeight: 120,
    marginTop: 12,
    alignItems: "center",
    justifyContent: "flex-start",
  },

  title: {
    textAlign: "center",
    fontSize: 26,
    fontWeight: "900",
    color: TEXT,
    lineHeight: 36,
  },

  buttonArea: {
    position: "absolute",
    left: 22,
    right: 22,
    bottom: 72,
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