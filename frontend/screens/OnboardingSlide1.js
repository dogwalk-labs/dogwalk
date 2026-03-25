import React from "react";
import { View, Text, StyleSheet, Image, Dimensions } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BG = "#FBF3DD";
const TEXT = "#5A4A37";

export default function OnboardingSlide1() {
  return (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <Image
        source={require("../assets/endScreen_dog.png")}
        style={styles.icon}
        resizeMode="contain"
      />
      <Text style={styles.title}>오늘 산책{"\n"}어디로 갈까?</Text>
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
    width: 170,
    height: 170,
    marginBottom: 24,
  },
  title: {
    textAlign: "center",
    color: TEXT,
    fontSize: 42,
    lineHeight: 56,
    fontWeight: "900",
  },
});
