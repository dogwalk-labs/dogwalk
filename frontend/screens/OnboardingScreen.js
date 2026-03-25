import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, ScrollView, Dimensions, Text, Alert } from "react-native";
import OnboardingSlide1 from "./OnboardingSlide1";
import OnboardingSlide2 from "./OnboardingSlide2";
import OnboardingSlide3 from "./OnboardingSlide3";
import LoginScreen from "./LoginScreen";
import RegisterScreen from "./RegisterScreen";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BG = "#FBF3DD";

export default function OnboardingScreen({ navigation }) {
  const scrollRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeView, setActiveView] = useState("onboarding");

  const onScroll = (e) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / SCREEN_WIDTH);
    if (index !== currentIndex) setCurrentIndex(index);
  };

  useEffect(() => {
    if (activeView !== "onboarding") return;
    if (currentIndex !== 2) return;
    // 회원가입 -> 뒤로가기일 때 3번째 슬라이드로 복귀
    scrollRef.current?.scrollTo({ x: 2 * SCREEN_WIDTH, animated: false });
  }, [activeView, currentIndex]);

  if (activeView === "login") {
    return (
      <LoginScreen
        onBack={() => setActiveView("onboarding")}
        onLoginPress={() => navigation.replace("MainTabs")}
        onSignupPress={() => {
          setActiveView("register");
          setCurrentIndex(2);
        }}
        onForgotPress={() => Alert.alert("안내", "비밀번호 찾기는 추후 연결 예정이에요.")}
      />
    );
  }

  if (activeView === "register") {
    return (
      <RegisterScreen
        onBack={() => {
          setActiveView("onboarding");
          setCurrentIndex(2);
        }}
        onSignupPress={() => setActiveView("login")}
      />
    );
  }

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
          onSignupPress={() => setActiveView("register")}
          onLoginPress={() => setActiveView("login")}
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
