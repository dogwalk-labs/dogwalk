import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const BG = "#FBF3DD";
const TEXT = "#2B2B2B";
const BROWN = "#B08B5A";
const BORDER = "rgba(84, 50, 208, 0.12)";

export default function TimeSelectScreen({ navigation, route }) {
  const [selectedMinutes, setSelectedMinutes] = useState(30);

  const selectedTags = route?.params?.selectedTags ?? [];

  const options = useMemo(
    () => [
      { label: "30분", value: 30 },
      { label: "60분", value: 60 },
      { label: "90분", value: 90 },
    ],
    []
  );

  const goNext = () =>
    navigation.navigate("RouteSelect", {
      minutes: selectedMinutes,
      selectedTags,
    });

  const TimePill = ({ label, value, wide }) => {
    const selected = selectedMinutes === value;

    return (
      <Pressable
        onPress={() => setSelectedMinutes(value)}
        style={({ pressed }) => [
          styles.pill,
          wide ? styles.pillWide : styles.pillHalf,
          selected ? styles.pillSelected : styles.pillUnselected,
          pressed && styles.pillPressed,
        ]}
      >
        <Text
          style={[
            styles.pillText,
            selected ? styles.pillTextSelected : styles.pillTextUnselected,
          ]}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
          onPress={() => navigation.goBack()}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={28} color={TEXT} />
        </Pressable>

        <View style={styles.hero}>
          <Text style={styles.heroIcon}>🐾</Text>
        </View>

        <Text style={styles.title}>
          오늘 ‘둥이’의{"\n"}산책 목표 시간은?
        </Text>

        <View style={styles.pillArea}>
          <View style={styles.row}>
            {options.slice(0, 2).map((item) => (
              <TimePill key={item.value} label={item.label} value={item.value} />
            ))}
          </View>

          <View style={styles.rowCenter}>
            <TimePill label={options[2].label} value={options[2].value} wide />
          </View>
        </View>

        <View style={styles.bottomArea}>
          <Pressable
            style={({ pressed }) => [
              styles.recommendBtn,
              pressed && styles.recommendBtnPressed,
            ]}
            onPress={goNext}
          >
            <Text style={styles.recommendText}>추천 코스 보기</Text>
          </Pressable>
        </View>

        <View style={styles.dots}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>
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

  backBtnPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },

  hero: {
    marginTop: 150,
    alignItems: "center",
  },

  heroIcon: {
    fontSize: 90,
    lineHeight: 96,
  },

  title: {
    marginTop: 18,
    textAlign: "center",
    fontSize: 26,
    fontWeight: "900",
    color: TEXT,
    lineHeight: 34,
  },

  pillArea: {
    marginTop: 50,
    width: "100%",
    gap: 14,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  rowCenter: {
    alignItems: "center",
  },

  pill: {
    height: 52,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  pillHalf: {
    width: "48%",
  },

  pillWide: {
    width: "58%",
  },

  pillUnselected: {
    borderColor: BORDER,
  },

  pillSelected: {
    borderColor: BROWN,
  },

  pillPressed: {
    transform: [{ scale: 0.97 }],
  },

  pillText: {
    fontSize: 18,
    fontWeight: "900",
  },

  pillTextUnselected: {
    color: BROWN,
  },

  pillTextSelected: {
    color: "#7e613cff",
  },

  bottomArea: {
    width: "100%",
    marginTop: 70,
  },

  recommendBtn: {
    width: "100%",
    height: 68,
    backgroundColor: BROWN,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  recommendBtnPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },

  recommendText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
  },

  dots: {
    position: "absolute",
    bottom: 26,
    flexDirection: "row",
    gap: 10,
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  dotActive: {
    backgroundColor: "rgba(0,0,0,0.45)",
  },
});