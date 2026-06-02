import React, { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Image,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { API_BASE_URL } from "../config/config";
import { getCurrentUser, getAccessToken } from "../auth/authStorage";

const MEDAL_EMOJI = { 1: "🥇", 2: "🥈", 3: "🥉" };

function DogRankAvatar({ imageUrl }) {
  return (
    <View style={styles.avatarCircle}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.avatarImage} />
      ) : (
        <Text style={styles.avatarEmoji}>🐶</Text>
      )}
    </View>
  );
}

export default function RankingScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 12) + 88;

  const [leaderboard, setLeaderboard] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [myDogProfile, setMyDogProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const loadData = async () => {
        try {
          setLoading(true);
          const user = await getCurrentUser();
          const token = await getAccessToken();

          if (!user?.id || !token) return;

          const rankRes = await fetch(`${API_BASE_URL}/paths/ranking/monthly`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const rankData = await rankRes.json();
          console.log("### 랭킹 데이터:", JSON.stringify(rankData.myStats));

          const profileRes = await fetch(`${API_BASE_URL}/profiles/me/${user.id}`);
          const profileData = await profileRes.json();

          if (!cancelled) {
            setLeaderboard(rankData.leaderboard ?? []);
            setMyStats(rankData.myStats ?? null);
            setMyDogProfile(profileData?.dog ?? null);
          }
        } catch (e) {
          console.error("랭킹 로드 실패:", e);
        } finally {
          if (!cancelled) setLoading(false);
        }
      };

      loadData();
      return () => { cancelled = true; };
    }, [])
  );

  const myDogName = myDogProfile?.name ?? "반려견";

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backHit}
            onPress={() => { if (navigation.canGoBack()) navigation.goBack(); }}
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

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#8B5E3C" />
        ) : leaderboard.length === 0 ? (
          <Text style={styles.emptyText}>이번 달 산책 기록이 없어요 🐾</Text>
        ) : (
          leaderboard.map((row) => (
            <View key={row.id} style={styles.rankCard}>
              <View style={styles.avatarWrap}>
                <DogRankAvatar imageUrl={row.dogImageUrl} />
                {row.rank <= 3 && (
                  <Text style={styles.medalBadge}>
                    {MEDAL_EMOJI[row.rank]}
                  </Text>
                )}
              </View>
              <View style={styles.rankBody}>
                <Text style={styles.rankNameLine} numberOfLines={1}>
                  <Text style={styles.rankName}>{row.dogName}</Text>
                  <Text style={styles.rankDistance}> ({row.distanceKm.toFixed(2)}km)</Text>
                </Text>
                <Text style={styles.rankMeta} numberOfLines={1}>
                  {row.nickname}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.outlineBtn}
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate("UserProfile", {
                    userId: row.id,
                    userName: row.nickname,
                    dogName: row.dogName,
                    distanceKm: row.distanceKm,
                  })
                }
              >
                <Text style={styles.outlineBtnText}>프로필 보기</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>내 순위</Text>
        <View style={styles.rankCard}>
          <View style={styles.avatarWrap}>
            <DogRankAvatar imageUrl={myDogProfile?.image_url} />
          </View>
          <View style={styles.rankBody}>
            <Text style={styles.rankNameLine} numberOfLines={1}>
              <Text style={styles.rankName}>{myDogName}</Text>
              <Text style={styles.rankDistance}>
                {" "}({myStats?.distanceKm?.toFixed(2) ?? "0.00"}km)
              </Text>
            </Text>
          </View>
          <View style={styles.myRankPill}>
            <Text style={styles.myRankPillText}>
              이달의 {myStats?.rank ?? "-"}위
            </Text>
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
  headerSpacer: { width: 32 },
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
  emptyText: {
    textAlign: "center",
    color: "#A8A29E",
    fontSize: 15,
    marginTop: 40,
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
    overflow: "hidden",
    width: 56,
  },
  avatarImage: {
    height: 56,
    width: 56,
  },
  avatarEmoji: { fontSize: 28 },
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
  rankNameLine: { marginBottom: 2 },
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