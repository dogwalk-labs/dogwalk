import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function TimeSelectScreen({ navigation }) {
  const [selectedMinutes, setSelectedMinutes] = useState(30);

  const options = useMemo(
    () => [
      { label: "30분", value: 30 },
      { label: "60분", value: 60 },
      { label: "90분", value: 90 },
    ],
    []
  );

  const goNext = () => navigation.navigate("RouteSelect", { minutes: selectedMinutes });

  const TimePill = ({ label, value, wide }) => {
    const selected = selectedMinutes === value;
    return (
      <Pressable
        onPress={() => setSelectedMinutes(value)}
        style={[
          styles.pill,
          wide ? styles.pillWide : styles.pillHalf,
          selected ? styles.pillSelected : styles.pillUnselected,
        ]}
      >
        <Text style={[styles.pillText, selected ? styles.pillTextSelected : styles.pillTextUnselected]}>
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* 뒤로가기 */}
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color="#2B2B2B" />
        </Pressable>

       
        <View style={styles.hero}>
          <Text style={styles.heroIcon}>🐾</Text>
        </View>

        
        <Text style={styles.title}>
          오늘 ‘둥이’의{"\n"}산책 목표 시간은?
        </Text>

        {/* 시간 버튼 */}
        <View style={styles.pillArea}>
          <View style={styles.row}>
            <TimePill label="30분" value={30} />
            <TimePill label="60분" value={60} />
          </View>
          <View style={styles.rowCenter}>
            <TimePill label="90분" value={90} wide />
          </View>
        </View>

        {/*  시간 버튼 /}
        <View style={{ height: 70 }} />

        {/* 추천 코스 보기 */}
        <Pressable style={styles.recommendBtn} onPress={goNext}>
          <Text style={styles.recommendText}>추천 코스 보기</Text>
        </Pressable>

        {/* 아래 도트 */}
        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const BG = "#FBF3DD";
const TEXT = "#2B2B2B";
const BROWN = "#B08B5A";
const BORDER = "rgba(84, 50, 208, 0.12)";

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

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
  },

  pillHalf: { width: "48%" },
  pillWide: { width: "58%" },

  pillUnselected: { borderColor: BORDER },
  pillSelected: { borderColor: BROWN },

  pillText: { fontSize: 18, fontWeight: "900" },
  pillTextUnselected: { color: BROWN },
 pillTextSelected: {
  color: "#7e613cff",
},

  recommendBtn: {
    width: "100%",
    height: 68,
    backgroundColor: BROWN,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateY: 50 }],
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
