import React from "react";
import { View, Text, StyleSheet, Image, Dimensions } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BG = "#FBF3DD";
const TEXT = "#5A4A37";

export default function OnboardingSlide2() {
  return (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <Image
        source={require("../assets/endScreen_footprint.png")}
        style={styles.icon}
        resizeMode="contain"
      />
      <Text style={styles.title}>반려동물과{"\n"}함께 걷기 좋은 코스를{"\n"}추천해줄게요!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  icon: {
    width: 190,
    height: 140,
    marginBottom: 34,
  },
  title: {
    textAlign: "center",
    color: TEXT,
    fontSize: 38,
    lineHeight: 52,
    fontWeight: "900",
  },
});
