import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Alert,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const BG = "#FBF3DD";
const TEXT = "#2B2B2B";
const BROWN = "#B08B5A";

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

export default function WalkPreferenceScreen({ navigation }) {
  const [selectedKeys, setSelectedKeys] = useState([]);

  const toggleTag = (key) => {
    setSelectedKeys((prev) => {
      const alreadySelected = prev.includes(key);

      if (alreadySelected) {
        return prev.filter((v) => v !== key);
      }

      if (prev.length >= 3) {
        Alert.alert("알림", "최대 3개까지 선택 가능하다멍!");
        return prev;
      }

      return [...prev, key];
    });
  };

  const goNext = () => {
    navigation.navigate("TimeSelect", {
      selectedTags: selectedKeys,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
        
        {/* 뒤로가기 */}
        <Pressable
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={28} color={TEXT} />
        </Pressable>

        {/* 제목 */}
        <Text style={styles.title}>
          오늘 하고 싶은{"\n"}산책 키워드를 말해 주세요!
        </Text>

        {/* 태그 */}
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
                  { backgroundColor: selected ? tag.active : tag.bg },
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

        {/* 다음 버튼 */}
        <Pressable style={styles.nextButton} onPress={goNext}>
          <Text style={styles.nextText}>다음으로</Text>
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

  slide: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  backBtn: {
    position: "absolute",
    top: 8,
    left: 10,
    padding: 8,
    zIndex: 10,
  },

  title: {
    fontSize: 26,
    fontWeight: "900",
    color: TEXT,
    textAlign: "center",
    lineHeight: 36,
    marginBottom: 40,
  },

  tagWrap: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: 4,
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

  nextButton: {
    marginTop: 40,
    width: "90%",
    height: 60,
    backgroundColor: BROWN,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  nextText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
});