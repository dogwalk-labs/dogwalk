import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Alert,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const BG = "#FBF3DD";
const TEXT = "#2B2B2B";
const BROWN = "#8E6A3D";  // ⭐ 버튼 색상

const TAGS = [
  { key: "park", label: "공원", emoji: "🌳", bg: "#E8F6E8", text: "#2E8B57", active: "#37A66A" },
  { key: "river", label: "하천", emoji: "🌊", bg: "#E8F4FF", text: "#4A84C4", active: "#5C97DA" },
  { key: "trail", label: "산책로", emoji: "🐾", bg: "#FDF0D9", text: "#B07A2A", active: "#C88A2E" },
  { key: "wideRoad", label: "넓은 길", emoji: "🛣️", bg: "#F1F1F1", text: "#6B6B6B", active: "#8C8C8C" },
  { key: "carFree", label: "차 없는 거리", emoji: "🚶", bg: "#FBEAEA", text: "#C96A6A", active: "#DB7B7B" },
  { key: "smellGood", label: "냄새 맡기 좋음", emoji: "🐶", bg: "#FFF3D8", text: "#A9791C", active: "#C18D23" },
  { key: "nightWalk", label: "야간 산책", emoji: "🌙", bg: "#EEE9FF", text: "#7664C2", active: "#8A77D8" },
  { key: "flatRoad", label: "평지", emoji: "👟", bg: "#F5EBDD", text: "#9A6E3A", active: "#B28045" },
  { key: "quiet", label: "조용한 곳", emoji: "🔕", bg: "#f9f9f9", text: "#a0a0a0", active: "#b1b1b1" },
  { key: "nature", label: "자연 많은 곳", emoji: "🌿", bg: "#EEF9E8", text: "#66A04A", active: "#78B75A" },
];

export default function WalkReviewSlide3({ onSelectTags, onConfirm }) {  // ⭐ onConfirm 추가
  const [selectedKeys, setSelectedKeys] = useState([]);

  const toggleTag = (key) => {
    setSelectedKeys((prev) => {
      const alreadySelected = prev.includes(key);

      if (alreadySelected) {
        const next = prev.filter((v) => v !== key);
        onSelectTags?.(next);
        return next;
      }

      if (prev.length >= 3) {
        Alert.alert(
          "알림",
          "최대 3개까지 선택 가능하다멍!",
          [{ text: "확인하기" }]
        );
        return prev;
      }

      const next = [...prev, key];
      onSelectTags?.(next);
      return next;
    });
  };

  // ⭐ 확인 버튼 핸들러
  const handleConfirm = () => {
    if (selectedKeys.length === 0) {
      Alert.alert("알림", "최소 1개 이상 선택해주세요!", [{ text: "확인" }]);
      return;
    }
    onConfirm?.();
  };

  return (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <Text style={styles.title}>
        오늘 산책과 어울리는{"\n"}키워드를 말해 주세요!
      </Text>

      <View style={styles.tagWrap}>
        {TAGS.map((tag) => {
          const selected = selectedKeys.includes(tag.key);

          return (
            <Pressable
              key={tag.key}
              onPress={() => toggleTag(tag.key)}
              style={({ pressed }) => [
                styles.tagButton,
                styles.shadowButton,
                {
                  backgroundColor: selected ? tag.active : tag.bg,
                },
                pressed && styles.buttonPressed,
              ]}
            >
              <Text
                style={[
                  styles.tagText,
                  { color: selected ? "#FFFFFF" : tag.text },
                ]}
              >
                {tag.emoji} {tag.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.hint}>
        선택한 카테고리는 다음 코스 추천에 반영돼요!
      </Text>

      {/* ⭐ 확인 버튼 추가 */}
      <Pressable
        onPress={handleConfirm}
        style={({ pressed }) => [
          styles.confirmBtn,
          selectedKeys.length === 0 && styles.confirmBtnDisabled,
          pressed && styles.buttonPressed,
        ]}
        disabled={selectedKeys.length === 0}
      >
        <Text style={styles.confirmText}>
          선택 완료 ({selectedKeys.length}/3)
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontSize: 27,
    fontWeight: "800",
    color: TEXT,
    textAlign: "center",
    lineHeight: 38,
    marginBottom: 34,
    transform: [{ translateY: -20 }],
  },

  tagWrap: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: 4,
    transform: [{ translateY: -8 }],
  },

  shadowButton: {
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },

  tagButton: {
    minWidth: 110,
    maxWidth: "46%",
    height: 50,
    paddingHorizontal: 18,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },

  buttonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.95,
  },

  tagText: {
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },

  hint: {
    marginTop: 34,
    fontSize: 13,
    color: "#8D867C",
    textAlign: "center",
    fontWeight: "600",
  },

  /* ⭐ 확인 버튼 스타일 */
  confirmBtn: {
    marginTop: 24,
    width: "100%",
    maxWidth: 280,
    height: 52,
    borderRadius: 26,
    backgroundColor: BROWN,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },

  confirmBtnDisabled: {
    backgroundColor: "#C9C9C9",
  },

  confirmText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});