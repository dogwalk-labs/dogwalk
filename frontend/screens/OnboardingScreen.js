import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, ScrollView, Dimensions, Text, Alert } from "react-native";
import { API_BASE_URL } from "../config/config";
import { saveAuthSession } from "../auth/authStorage";
import OnboardingSlide1 from "./OnboardingSlide1";
import OnboardingSlide2 from "./OnboardingSlide2";
import OnboardingSlide3 from "./OnboardingSlide3";
import LoginScreen from "./LoginScreen";
import RegisterScreen from "./RegisterScreen";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BG = "#FBF3DD";

function formatApiErrorDetail(detail, fallbackMessage) {
  if (detail == null) return fallbackMessage;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item.msg === "string") return item.msg;
        return JSON.stringify(item);
      })
      .filter(Boolean)
      .join("\n");
  }
  return fallbackMessage;
}

export default function OnboardingScreen({ navigation }) {
  const scrollRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeView, setActiveView] = useState("onboarding");
  const [signupSubmitting, setSignupSubmitting] = useState(false);
  const [loginSubmitting, setLoginSubmitting] = useState(false);

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
        submitting={loginSubmitting}
        onBack={() => setActiveView("onboarding")}
        onLoginPress={async ({ email, password }) => {
          if (loginSubmitting) return;
          setLoginSubmitting(true);
          try {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: email.trim().toLowerCase(),
                password,
              }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
              Alert.alert(
                "로그인 실패",
                formatApiErrorDetail(
                  data.detail,
                  "이메일 또는 비밀번호를 확인해 주세요."
                )
              );
              return;
            }
            await saveAuthSession({
              access_token: data.access_token,
              id: data.id,
              email: data.email,
              nickname: data.nickname,
            });
            navigation.replace("MainTabs");
          } catch {
            Alert.alert("오류", "네트워크 오류가 발생했습니다.");
          } finally {
            setLoginSubmitting(false);
          }
        }}
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
        submitting={signupSubmitting}
        onBack={() => {
          setActiveView("onboarding");
          setCurrentIndex(2);
        }}
        onSignupPress={async (payload) => {
          if (signupSubmitting) return;
          setSignupSubmitting(true);

          try {
            // 디버깅용 로그 추가
            // console.log("회원가입 요청 payload:", {
            //   email: payload.email.trim(),
            //   password: payload.password,
            //   password_confirm: payload.password_confirm,
            //   nickname: payload.nickname?.trim() || null,
            // });

            const res = await fetch(`${API_BASE_URL}/auth/signup`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: payload.email.trim(),
                password: payload.password,
                password_confirm: payload.password_confirm,
                nickname: payload.nickname?.trim() || null,
              }),
            });

            const data = await res.json().catch(() => ({}));

            //디버깅용 로그 주석처리
            //console.log("signup status:", res.status);
            //console.log("signup data:", data);

            if (!res.ok) {
              Alert.alert(
                "회원가입 실패",
                formatApiErrorDetail(data.detail, "회원가입에 실패했습니다.")
              );
              return;
            }

            Alert.alert("가입 완료", "로그인 화면에서 로그인해 주세요.", [
              { text: "확인", onPress: () => setActiveView("login") },
            ]);
          } catch(error) {
            console.log("signup error:", error);
            Alert.alert("오류", "네트워크 오류가 발생했습니다.");
          } finally {
            setSignupSubmitting(false);
          }
        }}
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
