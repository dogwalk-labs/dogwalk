import React, { useRef, useState } from "react";
import { View, StyleSheet, ScrollView, Dimensions, Text, Alert } from "react-native";
import OnboardingSlide1 from "./OnboardingSlide1";
import OnboardingSlide2 from "./OnboardingSlide2";
import OnboardingSlide3 from "./OnboardingSlide3";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BG = "#FBF3DD";

export default function OnboardingScreen() {
  const scrollRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onScroll = (e) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / SCREEN_WIDTH);
    if (index !== currentIndex) setCurrentIndex(index);
  };

  return (
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
        <OnboardingSlide1 />
        <OnboardingSlide2 />
        <OnboardingSlide3
          onSignupPress={() => Alert.alert("안내", "회원가입 화면은 추후 연결 예정이에요.")}
          onLoginPress={() => Alert.alert("안내", "로그인 화면은 추후 연결 예정이에요.")}
        />
      </ScrollView>

      <View style={styles.dots}>
        {[0, 1, 2].map((i) => (
          <Text key={i} style={[styles.dot, i === currentIndex && styles.dotActive]}>
            ●
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  scrollContent: {
    backgroundColor: BG,
  },
  dots: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    color: "#D0CABF",
    fontSize: 10,
    lineHeight: 10,
  },
  dotActive: {
    color: "#2B2B2B",
  },
});
