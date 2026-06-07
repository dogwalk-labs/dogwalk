import React, { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
  ActivityIndicator,
  Image,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_BASE_URL } from "../../config/config";
import { getCurrentUser, getAccessToken } from "../../auth/authStorage";

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
  const bottomPad = Math.max(insets.bottom, 12) + 112;

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

      return () => {
        cancelled = true;
      };
    }, [])
  );

  const myDogName = myDogProfile?.name ?? "반려견";

  const getRankCardStyle = (rank) => {
    if (rank === 1) return styles.firstRankCard;
    if (rank === 2) return styles.secondRankCard;
    if (rank === 3) return styles.thirdRankCard;
    return null;
  };

  const getRankBadgeStyle = (rank) => {
    if (rank === 1) return styles.firstRankBadge;
    if (rank === 2) return styles.secondRankBadge;
    if (rank === 3) return styles.thirdRankBadge;
    return styles.normalRankBadge;
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>랭킹 페이지</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.heroArea}>
          <View style={styles.heroTitleChip}>
            <Text style={styles.heroIcon}>🏆</Text>
            <Text style={styles.heroTitle}>이달의 산책왕</Text>
          </View>

          <Text style={styles.heroSub}>
            이번 달 가장 열심히 걸은 친구들이에요
          </Text>

          <Text style={styles.resetCaption}>
            매달 1일 00:00시에 새롭게 시작됩니다.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#9A7654" />
        ) : leaderboard.length === 0 ? (
          <Text style={styles.emptyText}>이번 달 산책 기록이 없어요 🐾</Text>
        ) : (
          leaderboard.map((row) => {
            const isTopRank = row.rank <= 3;

            return (
              <View
                key={row.id}
                style={[styles.rankCard, getRankCardStyle(row.rank)]}
              >
                <View style={styles.avatarWrap}>
                  <DogRankAvatar imageUrl={row.dogImageUrl} />

                  {isTopRank && (
                    <Text style={styles.medalBadge}>
                      {MEDAL_EMOJI[row.rank]}
                    </Text>
                  )}
                </View>

                <View style={styles.rankBody}>
                  <View style={styles.rankTopLine}>
                    <View style={[styles.rankBadge, getRankBadgeStyle(row.rank)]}>
                      <Text style={styles.rankBadgeText}>{row.rank}위</Text>
                    </View>

                    <Text style={styles.rankNameLine} numberOfLines={1}>
                      <Text style={styles.rankName}>{row.dogName}</Text>
                      <Text style={styles.rankDistance}>
                        {" "}({row.distanceKm.toFixed(2)}km)
                      </Text>
                    </Text>
                  </View>

                  <Text style={styles.rankMeta} numberOfLines={1}>
                    {row.nickname}
                  </Text>
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.profileButton,
                    pressed && styles.profileButtonPressed,
                  ]}
                  onPress={() =>
                    navigation.navigate("UserProfile", {
                      userId: row.id,
                      userName: row.nickname,
                      dogName: row.dogName,
                      distanceKm: row.distanceKm,
                    })
                  }
                >
                  <Text style={styles.profileButtonText}>프로필 보기</Text>
                </Pressable>
              </View>
            );
          })
        )}
      </ScrollView>

      <View
        style={[
          styles.myRankFixedArea,
          { paddingBottom: Math.max(insets.bottom, 10) + 4 },
        ]}
      >
        <View style={styles.myRankHeaderRow}>
          <Text style={styles.myRankTitle}>내 순위</Text>
          <Text style={styles.myRankSub}>이번 달 내 산책 기록</Text>
        </View>

        <View style={styles.myRankCard}>
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
              {myStats?.rank ?? "-"}위
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFDF5",
  },

  scrollContent: {
    paddingHorizontal: 20,
  },

  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
    transform: [{ translateY: 4 }],
  },

  headerSpacer: {
    width: 32,
  },

  headerTitle: {
    color: "#4A3420",
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  heroArea: {
    alignItems: "center",
    marginBottom: 18,
  },

  heroTitleChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#C8AA7A",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 9,
    marginBottom: 9,
    shadowColor: "#2D1810",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },

  heroIcon: {
    fontSize: 17,
    marginRight: 7,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.2,
  },

  heroSub: {
    color: "#8F8982",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 4,
  },

  resetCaption: {
    color: "#B3ACA4",
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16,
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
    borderRadius: 20,
    flexDirection: "row",
    marginBottom: 11,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: "#2D1810",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.045,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(93, 65, 38, 0.04)",
  },

  firstRankCard: {
    backgroundColor: "#FFF9E8",
    borderColor: "#E5C978",
  },

  secondRankCard: {
    backgroundColor: "#FAF8F3",
    borderColor: "#CBC3B7",
  },

  thirdRankCard: {
    backgroundColor: "#FAF0E5",
    borderColor: "#D0A178",
  },

  avatarWrap: {
    marginRight: 12,
    position: "relative",
  },

  avatarCircle: {
    alignItems: "center",
    backgroundColor: "#F2EBE3",
    borderRadius: 999,
    height: 54,
    justifyContent: "center",
    overflow: "hidden",
    width: 54,
  },

  avatarImage: {
    height: 54,
    width: 54,
  },

  avatarEmoji: {
    fontSize: 27,
  },

  medalBadge: {
    bottom: -5,
    fontSize: 21,
    position: "absolute",
    right: -7,
  },

  rankBody: {
    flex: 1,
    minWidth: 0,
  },

  rankTopLine: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  rankBadge: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginRight: 6,
  },

  firstRankBadge: {
    backgroundColor: "#D9AD43",
  },

  secondRankBadge: {
    backgroundColor: "#A9A39A",
  },

  thirdRankBadge: {
    backgroundColor: "#C18858",
  },

  normalRankBadge: {
    backgroundColor: "#D8C7B4",
  },

  rankBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },

  rankNameLine: {
    flexShrink: 1,
  },

  rankName: {
    color: "#141414",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  rankDistance: {
    color: "#8F8982",
    fontSize: 14,
    fontWeight: "800",
  },

  rankMeta: {
    color: "#8A847C",
    fontSize: 13,
    fontWeight: "700",
  },

  profileButton: {
    backgroundColor: "#F3E9DC",
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: "#E2CFB9",
  },

  profileButtonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.92 }],
  },

  profileButtonText: {
    color: "#7A5537",
    fontSize: 11,
    fontWeight: "900",
  },

  myRankFixedArea: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#F2E5D2",
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    shadowColor: "#2D1810",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.065,
    shadowRadius: 9,
    elevation: 8,
  },

  myRankHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  myRankTitle: {
    color: "#5F341C",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: -0.2,
  },

  myRankSub: {
    color: "#A08D78",
    fontSize: 11,
    fontWeight: "800",
  },

  myRankCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    flexDirection: "row",
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(139, 94, 60, 0.10)",
  },

  myRankPill: {
    backgroundColor: "#A57951",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginLeft: 6,
  },

  myRankPillText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
});