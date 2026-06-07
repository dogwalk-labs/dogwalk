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
const BROWN = "#72491b";
const SUBTEXT = "#A79A86";
const BORDER = "rgba(84, 50, 208, 0.12)";

export default function OnboardingSlide3({ onLoginPress, onSignupPress }) {
  return (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <View style={styles.hero}>
        <Image
          source={require("../../assets/onboardingPage_LoginRegister.png")}
          style={styles.icon}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>
        지금부터 우리와{"\n"}같이걷개 🐾
      </Text>
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
    paddingBottom: 40,
  },

  hero: {
    marginTop: -80,
    alignItems: "center",
  },

  icon: {
    width: 470,
    height: 425,
    transform: [{ translateY: 25 }],
  },

  title: {
    marginTop: -45,
    textAlign: "center",
    fontSize: 26,
    fontWeight: "900",
    color: TEXT,
    lineHeight: 36,
    transform: [{ translateY: 17 }],
  },

  subtitle: {
    marginTop: 8,
    marginBottom: 40,
    textAlign: "center",
    color: SUBTEXT,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    transform: [{ translateY: 20 }],
  },

  buttonArea: {
    width: "100%",
    alignItems: "center",
    gap: 10,
    marginTop: 18,
  },

  primaryButton: {
    width: "100%",
    height: 58,
    backgroundColor: BROWN,
    borderRadius: 16,
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
    fontSize: 18,
    fontWeight: "900",
  },

  secondaryButton: {
    width: "100%",
    height: 58,
    borderRadius: 16,
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
    fontSize: 18,
    fontWeight: "900",
  },
});