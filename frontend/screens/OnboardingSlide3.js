import React from "react";
import { View, Text, StyleSheet, Image, Pressable, Dimensions } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BG = "#FBF3DD";
const TEXT = "#5A4A37";
const BROWN = "#B08B5A";

export default function OnboardingSlide3({ onLoginPress, onSignupPress }) {
  return (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <Image
        source={require("../assets/endScreen_dog.png")}
        style={styles.icon}
        resizeMode="contain"
      />
      <Text style={styles.title}>멍멍워크 시작하기</Text>
      <Text style={styles.subtitle}>산책, 이제는 고민 없이</Text>

      <Pressable
        style={({ pressed }) => [styles.signupButton, pressed && styles.buttonPressed]}
        onPress={onSignupPress}
      >
        <Text style={styles.signupText}>회원 가입</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.loginButton, pressed && styles.buttonPressed]}
        onPress={onLoginPress}
      >
        <Text style={styles.loginText}>로그인</Text>
      </Pressable>
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
    width: 220,
    height: 220,
    marginBottom: 16,
  },
  title: {
    textAlign: "center",
    color: TEXT,
    fontSize: 42,
    lineHeight: 52,
    fontWeight: "900",
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 24,
    color: "#AFA696",
    fontSize: 20,
    fontWeight: "700",
  },
  signupButton: {
    width: "88%",
    height: 56,
    borderRadius: 28,
    backgroundColor: BROWN,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  signupText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  loginButton: {
    width: "88%",
    height: 56,
    borderRadius: 28,
    backgroundColor: "#EBEBEB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#D0D0D0",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  loginText: {
    color: "#222",
    fontSize: 18,
    fontWeight: "900",
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
  },
});
