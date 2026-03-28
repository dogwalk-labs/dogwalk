import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Dimensions,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const BG = "#FBF3DD";
const TEXT = "#2B2B2B";
const BROWN = "#B08B5A";
const SUBTEXT = "#A79A86";
const BORDER = "rgba(84, 50, 208, 0.12)";

export default function OnboardingSlide3({ onLoginPress, onSignupPress }) {
  return (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <View style={styles.hero}>
        <Image
          source={require("../assets/onboardingPage_LoginRegister.png")}
          style={styles.icon}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>멍멍워크 시작하기</Text>
      <Text style={styles.subtitle}>산책, 이제는 고민 없이!</Text>

      <View style={styles.buttonArea}>
        <Pressable
          onPress={onSignupPress}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>회원 가입</Text>
        </Pressable>

        <Pressable
          onPress={onLoginPress}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.secondaryButtonPressed,
          ]}
        >
          <Text style={styles.secondaryButtonText}>로그인</Text>
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

  hero: {
    marginTop: -20,
    alignItems: "center",
  },

  icon: {
    width: 300,
    height: 280,
  },

  title: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 26,
    fontWeight: "900",
    color: TEXT,
    lineHeight: 34,
  },

  subtitle: {
    marginTop: 8,
    marginBottom: 28,
    textAlign: "center",
    color: SUBTEXT,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
  },

  buttonArea: {
    width: "100%",
    alignItems: "center",
    gap: 12,
  },

  primaryButton: {
    width: "100%",
    height: 68,
    backgroundColor: BROWN,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  primaryButtonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.92,
  },

  primaryButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
  },

  secondaryButton: {
    width: "100%",
    height: 68,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  secondaryButtonPressed: {
    transform: [{ scale: 0.97 }],
    backgroundColor: "#F7F2EA",
  },

  secondaryButtonText: {
    color: BROWN,
    fontSize: 20,
    fontWeight: "900",
  },
});