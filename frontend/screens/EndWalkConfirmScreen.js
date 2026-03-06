import React from "react";
import { View, Text, StyleSheet, Pressable, SafeAreaView, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const BROWN = "#8E6A3D";
const TEXT = "#2B2B2B";

/**
 * 산책 종료 확인 화면 (첫 번째 사진)
 * - 뒤로가기: 취소 후 산책 진행 화면으로
 * - 종료하기: 산책 종료 (부모에서 onConfirm 처리)
 */
export default function EndWalkConfirmScreen({ onClose, onConfirm }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Pressable
          style={styles.backBtn}
          onPress={onClose}
          hitSlop={12}
        >
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
          <Text style={styles.titleLine1}>오늘의 산책을</Text>
          {"\n"}
          <Text style={styles.titleLine2}>여기서 종료할까요?</Text>
        </Text>

        <Pressable style={styles.confirmButton} onPress={onConfirm}>
          <Text style={styles.confirmButtonText}>종료하기</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f8f4ed",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    alignItems: "center",
  },
  backBtn: {
    alignSelf: "flex-start",
    padding: 8,
  },
  graphic: {
    marginTop: 32,
    alignItems: "center",
  },
  graphicImage: {
    width: 600,
    height: 440,
  },
  title: {
    marginTop: 36,
    textAlign: "center",
  },
  titleLine1: {
    fontSize: 20,
    fontWeight: "800",
    color: TEXT,
    lineHeight: 28,
  },
  titleLine2: {
    fontSize: 20,
    fontWeight: "800",
    color: TEXT,
    lineHeight: 28,
  },
  confirmButton: {
    marginTop: 40,
    width: "100%",
    maxWidth: 320,
    height: 56,
    borderRadius: 16,
    backgroundColor: BROWN,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },
});
