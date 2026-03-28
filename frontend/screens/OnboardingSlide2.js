import React from "react";
import { View, Text, StyleSheet, Image, Dimensions } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const BG = "#FBF3DD";
const TEXT = "#2B2B2B";

export default function OnboardingSlide2() {
  return (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <View style={styles.heroBox}>
        <Image
          source={require("../assets/onboardingPage_foot.png")}
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

  iconFoot: {
    width: 300,
    height: 200,
    transform: [{ translateY: -10 }],
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
});