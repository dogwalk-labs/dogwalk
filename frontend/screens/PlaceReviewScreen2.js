import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from "react-native";
import { API_BASE_URL } from "../config/config";
import { getAccessToken } from "../auth/authStorage";

const BG = "#FFFFFF";
const BROWN = "#B08B5A";
const TEXT = "#2B2B2B";
const YELLOW = "#FFB800";
const GRAY_STAR = "#E0E0E0";

export default function PlaceReviewScreen2({ navigation, route }) {
  const poiId = route?.params?.poiId;
  const poiTitle = route?.params?.poiTitle ?? "매장 이름";
  const poiAddress = route?.params?.poiAddress ?? "주소 정보 없음";

  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const canSubmit = rating > 0 && content.trim().length > 0;

  const saveReview = async () => {
    if (!canSubmit || saving) return;

    try {
      setSaving(true);

      const token = await getAccessToken();

      const res = await fetch(`${API_BASE_URL}/places/${poiId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating,
          content: content.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("오류", data.detail ?? "리뷰 저장에 실패했어요.");
        return;
      }

      Keyboard.dismiss();
      navigation.goBack();
    } catch (e) {
      console.error("리뷰 저장 실패:", e);
      Alert.alert("오류", "네트워크 오류가 발생했어요.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = () => {
    if (!canSubmit) return;

    Alert.alert(
      "리뷰 등록하기",
      "리뷰는 한 번 작성하면 수정/삭제가 불가능하다멍!",
      [
        { text: "취소하기", style: "cancel" },
        { text: "등록하기", onPress: saveReview },
      ]
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.header}>
            <Pressable
              style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backText}>‹</Text>
            </Pressable>
            <Text style={styles.headerTitle}>리뷰 작성하기</Text>
            <View style={styles.headerRight} />
          </View>

          <View style={styles.content}>
            <View style={styles.placeInfo}>
              <Text style={styles.placeName}>{poiTitle}</Text>
              <Text style={styles.placeAddress}>{poiAddress}</Text>
            </View>

            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable key={star} hitSlop={8} onPress={() => setRating(star)}>
                  <Text style={[styles.star, { color: star <= rating ? YELLOW : GRAY_STAR }]}>
                    ★
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              value={content}
              onChangeText={setContent}
              style={styles.textBox}
              multiline
              textAlignVertical="top"
              placeholder={"리뷰를 작성해주세요! 매장 청결도,\n음식 맛 등...."}
              placeholderTextColor="#C7C1BA"
              returnKeyType="default"
            />

            <View style={styles.bottomArea}>
              <Pressable
                disabled={!canSubmit || saving}
                style={({ pressed }) => [
                  styles.submitButton,
                  (!canSubmit || saving) && styles.submitButtonDisabled,
                  pressed && canSubmit && !saving && styles.buttonPressed,
                ]}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>
                  {saving ? "저장 중..." : "리뷰 등록하기"}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  container: { flex: 1, backgroundColor: BG },
  header: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  backButton: {
    width: 42,
    height: 42,
    justifyContent: "center",
  },
  backText: {
    fontSize: 36,
    color: "#B4A89A",
    lineHeight: 38,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "900",
    color: "#6F4B23",
  },
  headerRight: {
    width: 42,
  },
  content: {
    flex: 1,
    paddingHorizontal: 34,
    paddingTop: 20,
  },
  placeInfo: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  placeName: {
    fontSize: 22,
    fontWeight: "900",
    color: TEXT,
    marginBottom: 6,
  },
  placeAddress: {
    fontSize: 14,
    fontWeight: "700",
    color: "#8F867C",
  },
  starRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },
  star: {
    fontSize: 38,
    marginHorizontal: 1,
  },
  textBox: {
    minHeight: 190,
    borderRadius: 10,
    backgroundColor: "#FFF9ED",
    paddingHorizontal: 22,
    paddingVertical: 20,
    fontSize: 13,
    fontWeight: "700",
    color: "#5F5147",
    lineHeight: 21,
  },
  bottomArea: {
    marginTop: 38,
    alignItems: "center",
  },
  submitButton: {
    width: 210,
    height: 52,
    borderRadius: 26,
    backgroundColor: BROWN,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.55,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
});