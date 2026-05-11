import React, { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { API_BASE_URL } from "../config/config";
import { getCurrentUser } from "../auth/authStorage";

const MOCK_LEADERBOARD = [
  { id: "1", rank: 1, name: "코코", distanceKm: 623, breed: "푸들", age: 3 },
  { id: "2", rank: 2, name: "몽이", distanceKm: 150, breed: "보더콜리", age: 5 },
  { id: "3", rank: 3, name: "초코", distanceKm: 120, breed: "말티즈", age: 2 },
  { id: "4", rank: 4, name: "바둑이", distanceKm: 98, breed: "진돗개", age: 4 },
  { id: "5", rank: 5, name: "두부", distanceKm: 87, breed: "웰시코기", age: 6 },
  { id: "6", rank: 6, name: "루이", distanceKm: 72, breed: "비숑", age: 1 },
];

const MEDAL_EMOJI = { 1: "🥇", 2: "🥈", 3: "🥉" };

/** 월간 거리·순위 API 연동 전까지 고정 (반려견 정보는 프로필에서 로드) */
const MY_RANK_METRICS = { distanceKm: 12, monthlyRank: 97 };

export default function RankingScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 12) + 88;
  const [myDogProfile, setMyDogProfile] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const loadMyDog = async () => {
        try {
          const user = await getCurrentUser();
          if (!user?.id) {
            if (!cancelled) setMyDogProfile(null);
            return;
          }
          const res = await fetch(`${API_BASE_URL}/profiles/me/${user.id}`);
          const data = await res.json();
          if (!cancelled) setMyDogProfile(data?.dog ?? null);
        } catch {
          if (!cancelled) setMyDogProfile(null);
        }
      };

      loadMyDog();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const myDogName = myDogProfile?.name ?? "반려견";
  const myDogBreed = myDogProfile?.breed ?? "-";
  const myDogAgeLabel = myDogProfile?.age != null ? `${myDogProfile.age}세` : "-";

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backHit}
            onPress={() => {
              if (navigation.canGoBack()) navigation.goBack();
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.6}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>랭킹</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.modeChip}>
          <Text style={styles.modeChipText}>이달의 산책왕</Text>
        </View>
        <Text style={styles.resetCaption}> 
          이달의 산책왕 랭킹은 매달 1일 00:00시에 리셋됩니다.
        </Text>

        {MOCK_LEADERBOARD.map((row) => (
          <View key={row.id} style={styles.rankCard}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarEmoji}>🐶</Text>
              </View>
              {row.rank <= 3 ? (
                <Text style={styles.medalBadge} accessibilityLabel={`${row.rank}위`}>
                  {MEDAL_EMOJI[row.rank]}
                </Text>
              ) : null}
            </View>
            <View style={styles.rankBody}>
              <Text style={styles.rankNameLine} numberOfLines={1}>
                <Text style={styles.rankName}>{row.name}</Text>
                <Text style={styles.rankDistance}> ({row.distanceKm}km)</Text>
              </Text>
              <Text style={styles.rankMeta} numberOfLines={1}>
                {row.breed}, {row.age}세
              </Text>
            </View>
            <TouchableOpacity style={styles.outlineBtn} activeOpacity={0.85}>
              <Text style={styles.outlineBtnText}>프로필 보기</Text>
            </TouchableOpacity>
          </View>
        ))}

        <Text style={styles.sectionTitle}>내 순위</Text>
        <View style={styles.rankCard}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarEmoji}>🐶</Text>
            </View>
          </View>
          <View style={styles.rankBody}>
            <Text style={styles.rankNameLine} numberOfLines={1}>
              <Text style={styles.rankName}>{myDogName}</Text>
              <Text style={styles.rankDistance}> ({MY_RANK_METRICS.distanceKm}km)</Text>
            </Text>
            <Text style={styles.rankMeta} numberOfLines={1}>
              {myDogBreed} / {myDogAgeLabel}
            </Text>
          </View>
          <View style={styles.myRankPill}>
            <Text style={styles.myRankPillText}>이달의 {MY_RANK_METRICS.monthlyRank}위</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFBEA",
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backHit: {
    width: 32,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  backIcon: {
    color: "#8A8A8A",
    fontSize: 28,
    lineHeight: 30,
    fontWeight: "300",
  },
  headerTitle: {
    color: "#4A3420",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  headerSpacer: {
    width: 32,
  },
  modeChip: {
    alignSelf: "center",
    backgroundColor: "#8B5E3C",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginBottom: 10,
  },
  modeChipText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  resetCaption: {
    color: "#A8A29E",
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 17,
    marginBottom: 18,
    textAlign: "center",
  },
  rankCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    flexDirection: "row",
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: "#2D1810",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarWrap: {
    marginRight: 12,
    position: "relative",
  },
  avatarCircle: {
    alignItems: "center",
    backgroundColor: "#F2EBE3",
    borderRadius: 999,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  avatarEmoji: {
    fontSize: 28,
  },
  medalBadge: {
    bottom: -4,
    fontSize: 22,
    position: "absolute",
    right: -6,
  },
  rankBody: {
    flex: 1,
    minWidth: 0,
  },
  rankNameLine: {
    marginBottom: 2,
  },
  rankName: {
    color: "#141414",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  rankDistance: {
    color: "#9C9690",
    fontSize: 15,
    fontWeight: "600",
  },
  rankMeta: {
    color: "#8A847C",
    fontSize: 14,
    fontWeight: "500",
  },
  outlineBtn: {
    backgroundColor: "#EFEFEF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 6,
  },
  outlineBtnText: {
    color: "#6B6B6B",
    fontSize: 12,
    fontWeight: "600",
  },
  sectionTitle: {
    color: "#7A4E2E",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  myRankPill: {
    backgroundColor: "#8B5E3C",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginLeft: 6,
  },
  myRankPillText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
});
