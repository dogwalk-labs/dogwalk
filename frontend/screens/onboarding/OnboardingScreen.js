import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, ScrollView, Dimensions, Text, Alert } from "react-native";
import { API_BASE_URL } from "../../config/config";
import {
  saveAuthSession,
  getCurrentUser,
} from "../../auth/authStorage";
import OnboardingSlide1 from "./OnboardingSlide1";
import OnboardingSlide2 from "./OnboardingSlide2";
import OnboardingSlide3 from "./OnboardingSlide3";
import LoginScreen from "../login/LoginScreen";
import RegisterScreen from "../login/RegisterScreen";
import ForgotPasswordScreen from "../login/ForgotPasswordScreen";
import ResetPasswordScreen from "../login/ResetPasswordScreen";
import ProfileRequiredScreen from '../profile/ProfileRequiredScreen';
import UserProfileFormScreen from '../profile/UserProfileFormScreen';
import DogProfileFormScreen from '../profile/DogProfileFormScreen';

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
  const [resetEmail, setResetEmail] = useState("");

  const onScroll = (e) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / SCREEN_WIDTH);
    if (index !== currentIndex) setCurrentIndex(index);
  };

  const goToSlide = (index) => {
    scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
  };

  useEffect(() => {
    if (activeView !== "onboarding") return;
    if (currentIndex !== 2) return;
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

            const profileRes = await fetch(`${API_BASE_URL}/profiles/me/${data.id}`);
            const profileData = await profileRes.json();

            console.log("profile check:", profileData);

            if (profileData?.user_profile && profileData?.dog) {
              navigation.replace("MainTabs");
            } else {
              setActiveView("profileRequired");
            }
          } catch (error) {
            console.log("login error:", error);
            Alert.alert("오류", "네트워크 오류가 발생했습니다.");
          } finally {
            setLoginSubmitting(false);
          }
        }}
        onSignupPress={() => {
          setActiveView("register");
          setCurrentIndex(2);
        }}
        onForgotPress={() => setActiveView("forgotPassword")}
      />
    );
  }

  if (activeView === "forgotPassword") {
    return (
      <ForgotPasswordScreen
        onBack={() => setActiveView("login")}
        onVerified={(email) => {
          setResetEmail(email);
          setActiveView("resetPassword");
        }}
      />
    );
  }

  if (activeView === "resetPassword") {
    return (
      <ResetPasswordScreen
        email={resetEmail}
        onBack={() => setActiveView("forgotPassword")}
        onComplete={() => {
          setResetEmail("");
          setActiveView("login");
        }}
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

          const email = payload.email.trim().toLowerCase();
          const password = payload.password;
          const passwordConfirm = payload.password_confirm;
          const nickname = payload.nickname?.trim() || null;
          const passwordBytes = new TextEncoder().encode(password).length;
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

          if (!emailRegex.test(email)) {
            Alert.alert(
              "이메일 오류",
              "올바른 이메일 형식으로 입력해 주세요.\n예: dogwalk@example.com"
            );
            setSignupSubmitting(false);
            return;
          }

          if (password.length < 8) {
            Alert.alert(
              "비밀번호 오류",
              "비밀번호는 최소 8자 이상 입력해 주세요."
            );
            setSignupSubmitting(false);
            return;
          }

          if (passwordBytes > 72) {
            Alert.alert(
              "비밀번호 오류",
              `비밀번호가 너무 깁니다.\n현재 ${passwordBytes} bytes이며, 최대 72 bytes까지 사용할 수 있어요.`
            );
            setSignupSubmitting(false);
            return;
          }

          if (password !== passwordConfirm) {
            Alert.alert(
              "비밀번호 확인 오류",
              "비밀번호와 비밀번호 확인이 일치하지 않습니다."
            );
            setSignupSubmitting(false);
            return;
          }

          try {
            const res = await fetch(`${API_BASE_URL}/auth/signup`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email,
                password,
                password_confirm: passwordConfirm,
                nickname,
              }),
            });

            const rawText = await res.text();

            let data = {};
            try {
              data = rawText ? JSON.parse(rawText) : {};
            } catch {
              data = { raw: rawText };
            }

            console.log("signup status:", res.status);
            console.log("signup response:", data);

            if (!res.ok) {
              const detailMessage = formatApiErrorDetail(
                data.detail,
                data.raw || "서버에서 자세한 오류 메시지를 받지 못했습니다."
              );

              Alert.alert(
                "회원가입 실패",
                `상태 코드: ${res.status}\n\n원인: ${detailMessage}`
              );
              return;
            }

            Alert.alert("가입 완료", "로그인 화면에서 로그인해 주세요.", [
              { text: "확인", onPress: () => setActiveView("login") },
            ]);
          } catch (error) {
            console.log("signup error:", error);
            Alert.alert(
              "오류",
              `네트워크 오류가 발생했습니다.\n\n${String(error?.message || error)}`
            );
          } finally {
            setSignupSubmitting(false);
          }
        }}
      />
    );
  }

  if (activeView === "profileRequired") {
    return (
      <ProfileRequiredScreen
        onCreateProfilePress={() => setActiveView("userProfileForm")}
      />
    );
  }

  if (activeView === "userProfileForm") {
    return (
      <UserProfileFormScreen
        onNextPress={async (payload) => {
          try {
            const user = await getCurrentUser();

            const res = await fetch(`${API_BASE_URL}/profiles/user`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                user_id: user.id,
                nickname: payload.nickname,
                age: Number(payload.age),
                gender: payload.gender,
                emergency_contact: payload.emergencyContact,
              }),
            });

            const data = await res.json();
            console.log("user profile result:", data);

            setActiveView("dogProfileForm");
          } catch (e) {
            console.log(e);
            Alert.alert("오류", "사용자 정보 저장 실패");
          }
        }}
      />
    );
  }

  if (activeView === "dogProfileForm") {
    return (
      <DogProfileFormScreen
        onCompletePress={async (payload) => {
          try {
            const user = await getCurrentUser();

            const res = await fetch(`${API_BASE_URL}/profiles/dog`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                user_id: user.id,
                name: payload.name,
                age: Number(payload.age),
                gender: payload.gender,
                breed: payload.breed,
              }),
            });

            const data = await res.json();
            console.log("dog profile result:", data);

            if (!res.ok) {
              Alert.alert("오류", "반려견 정보 저장 실패");
              return;
            }

            navigation.replace("MainTabs");
          } catch (e) {
            console.log(e);
            Alert.alert("오류", "반려견 정보 저장 실패");
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
        onMomentumScrollEnd={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        <OnboardingSlide1 onNextPress={() => goToSlide(1)} />
        <OnboardingSlide2 onNextPress={() => goToSlide(2)} />
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
    bottom: 82,
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