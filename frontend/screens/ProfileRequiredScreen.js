import React from "react";
import { SafeAreaView, View, Text, Image, Pressable, StyleSheet } from "react-native";

const BG = "#FBF3DD";
const TEXT = "#2B2B2B";
const BROWN = "#B08B5A";

export default function ProfileRequiredScreen({ onCreateProfilePress }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Image
          source={require("../assets/onboardingPage_dog.png")}
          style={styles.image}
          resizeMode="contain"
        />
        <Text style={styles.title}>프로필을 생성해주세요!</Text>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
          onPress={onCreateProfilePress}
        >
          <Text style={styles.buttonText}>프로필 생성</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },
  container: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  image: {
    width: 360,
    height: 280,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: TEXT,
    marginTop: 12,
    marginBottom: 22,
    textAlign: "center",
  },
  button: {
    width: "100%",
    maxWidth: 200,
    height: 58,
    borderRadius: 29,
    backgroundColor: BROWN,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.94,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
});
