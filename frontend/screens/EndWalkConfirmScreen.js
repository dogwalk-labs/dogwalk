import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const BG = "#FBF3DD";
const BROWN = "#B08B5A";
const TEXT = "#2B2B2B";

/**
 * 산책 종료 확인 화면
 * - 뒤로가기: 취소 후 산책 진행 화면으로
 * - 종료하기: 산책 종료 (부모에서 onConfirm 처리)
 */
export default function EndWalkConfirmScreen({ onClose, onConfirm }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Pressable style={styles.backBtn} onPress={onClose} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color="#666" />
        </Pressable>

        <View style={styles.graphic}>
          <Image
            source={require("../assets/endScreen_dog.png")}
            style={styles.graphicImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>
          오늘의 산책을{"\n"}여기서 종료할까요?
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.confirmButton,
            pressed && styles.confirmButtonPressed,
          ]}
          onPress={onConfirm}
        >
          <Text style={styles.confirmButtonText}>종료하기</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },

  container: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 22,
    alignItems: "center",
  },

  backBtn: {
    position: "absolute",
    top: 8,
    left: 10,
    padding: 8,
    zIndex: 10,
  },

  graphic: {
    marginTop: 110,
    alignItems: "center",
  },

  graphicImage: {
    width: 420,
    height: 300,
  },

  title: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 26,
    fontWeight: "900",
    color: TEXT,
    lineHeight: 34,
    transform: [{ translateY: -18 }],
  },

  confirmButton: {
    width: "100%",
    maxWidth: 340,
    height: 68,
    backgroundColor: BROWN,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  confirmButtonPressed: {
    transform: [{ translateY: -10 }, { scale: 0.97 }],
    opacity: 0.9,
  },

  confirmButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
  },
});