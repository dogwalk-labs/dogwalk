import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "../config/config";

const BG = "#FFFFFF";
const CARD_BG = "#F3EEE5";
const SOFT_CARD = "#FFF8E8";
const BROWN = "#6F4B23";
const DARK_BROWN = "#4E3214";
const TEXT = "#1F1F1F";
const GRAY = "#8F877E";
const LINE = "rgba(111, 75, 35, 0.12)";
const BUBBLE_BG = "#EFE1D0";

const WALK_MESSAGES = [
  { title: "산책을 좋아하는 친구", subtitle: "함께 걷는 시간이 가장 행복해요" },
  { title: "자연을 사랑하는 친구", subtitle: "새로운 길을 걷는 걸 좋아해요" },
  { title: "오늘도 산책 완료!", subtitle: "꾸준한 산책이 건강을 만들어요" },
  { title: "산책 메이트", subtitle: "오늘도 즐겁게 걸어가고 있어요" },
  { title: "에너지 넘치는 친구", subtitle: "신나게 움직이는 걸 좋아해요" },
  { title: "행복한 산책러", subtitle: "매일이 기대되는 산책이에요" },
  { title: "활동적인 친구", subtitle: "밖에서 보내는 시간이 즐거워요" },
  { title: "공원 탐험가", subtitle: "새로운 냄새와 길을 찾아요" },
  { title: "산책이 취미", subtitle: "오늘도 발자국을 남기고 있어요" },
  { title: "꾸준한 산책왕", subtitle: "차근차근 기록을 쌓아가고 있어요" },
];

export default function UserPublicProfileScreen({ navigation, route }) {
  const userId = route?.params?.userId;
  const [profile, setProfile] = useState(null);
  const [walkStats, setWalkStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const randomMessage = useMemo(() => {
    const index = Math.floor(Math.random() * WALK_MESSAGES.length);
    return WALK_MESSAGES[index];
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/profiles/me/${userId}`);
        const data = await res.json();
        setProfile(data);

        const statsRes = await fetch(`${API_BASE_URL}/paths/stats/user/${userId}`);
        const statsData = await statsRes.json();
        setWalkStats(statsData);
      } catch (e) {
        console.error("프로필 로드 실패:", e);
      } finally {
        setLoading(false);
      }
    };

    if (userId) loadProfile();
    else setLoading(false);
  }, [userId]);

  const userName =
    profile?.user_profile?.nickname ?? route?.params?.userName ?? "유저명";

  const dogName = profile?.dog?.name ?? "반려견";
  const dogBreed = profile?.dog?.breed ?? "-";
  const dogAge = profile?.dog?.age ?? "-";
  const dogGender = profile?.dog?.gender === "female" ? "암컷" : "수컷";

  const weeklyDistance = (walkStats?.weekly?.distanceKm ?? 0).toFixed(2);
  const weeklyDuration = walkStats?.weekly?.duration ?? "0분";
  const monthlyDistance = (walkStats?.monthly?.distanceKm ?? 0).toFixed(2);
  const monthlyDuration = walkStats?.monthly?.duration ?? "0분";

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator style={{ marginTop: 100 }} color={BROWN} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={28} color="#B4A89A" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>프로필</Text>

          <View style={styles.headerRight} />
        </View>

        <Text style={styles.sectionTitle}>유저 프로필</Text>

        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            {profile?.user_profile?.image_url ? (
              <Image
                source={{ uri: profile.user_profile.image_url }}
                style={styles.avatarImage}
              />
            ) : (
              <Ionicons name="person" size={38} color="#CFC5B4" />
            )}
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.userName}>{userName}</Text>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionEmoji}>💗</Text>
          <Text style={styles.sectionTitleNoMargin}>
            '{userName}'의 반려동물
          </Text>
        </View>

        <View style={styles.dogCard}>
          <View style={styles.dogAvatarOuter}>
            {profile?.dog?.image_url ? (
              <Image
                source={{ uri: profile.dog.image_url }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.dogAvatarInner}>
                <Text style={styles.dogEmoji}>🐶</Text>
              </View>
            )}
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.dogName}>{dogName}</Text>
            <Text style={styles.dogInfo}>
              {dogGender}({dogAge}세) / {dogBreed}
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionEmoji}>🔥</Text>
          <Text style={[styles.sectionTitleNoMargin, { color: DARK_BROWN }]}>
            '{dogName}'의 산책기록
          </Text>
        </View>

        <View style={styles.recordCard}>
          <View style={styles.recordItem}>
            <Text style={styles.recordLabel}>주간</Text>
            <Text style={styles.recordDistance}>{weeklyDistance}km</Text>
            <Text style={styles.recordTime}>{weeklyDuration}</Text>
          </View>

          <View style={styles.recordDivider} />

          <View style={styles.recordItem}>
            <Text style={styles.recordLabel}>월간</Text>
            <Text style={styles.recordDistance}>{monthlyDistance}km</Text>
            <Text style={styles.recordTime}>{monthlyDuration}</Text>
          </View>
        </View>

        <View style={styles.messageCard}>
          <View style={styles.bubbleTail} />

          <View style={styles.messageIconBox}>
            <Text style={styles.messageIcon}>🐾</Text>
          </View>

          <View style={styles.messageTextBox}>
            <Text style={styles.messageTitle}>{randomMessage.title}</Text>
            <Text style={styles.messageSub}>{randomMessage.subtitle}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },

  content: {
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 36,
  },

  header: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  backButton: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  headerTitle: {
    color: BROWN,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  headerRight: {
    width: 42,
  },

  sectionTitle: {
    color: BROWN,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.2,
    marginBottom: 10,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },

  sectionEmoji: {
    fontSize: 18,
    marginRight: 7,
  },

  sectionTitleNoMargin: {
    color: BROWN,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.2,
  },

  userCard: {
    minHeight: 104,
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderRadius: 18,
    flexDirection: "row",
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOpacity: 0.035,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },

  userAvatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#FFF3CA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 22,
    overflow: "hidden",
  },

  dogCard: {
    minHeight: 108,
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderRadius: 18,
    flexDirection: "row",
    paddingHorizontal: 18,
    paddingVertical: 13,
    shadowColor: "#000",
    shadowOpacity: 0.035,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },

  dogAvatarOuter: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 22,
    overflow: "hidden",
  },

  dogAvatarInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F5EEE5",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  dogEmoji: {
    fontSize: 28,
  },

  cardContent: {
    flex: 1,
    justifyContent: "center",
  },

  userName: {
    color: TEXT,
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  dogName: {
    color: TEXT,
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.4,
    marginBottom: 6,
  },

  dogInfo: {
    color: GRAY,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18,
  },

  recordCard: {
    height: 104,
    borderRadius: 20,
    backgroundColor: SOFT_CARD,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: LINE,
  },

  recordItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  recordLabel: {
    color: DARK_BROWN,
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 7,
  },

  recordDistance: {
    color: TEXT,
    fontSize: 21,
    fontWeight: "900",
    marginBottom: 3,
  },

  recordTime: {
    color: GRAY,
    fontSize: 13,
    fontWeight: "800",
  },

  recordDivider: {
    width: 1,
    height: 56,
    backgroundColor: LINE,
  },

  messageCard: {
    marginTop: 26,
    marginHorizontal: 8,
    borderRadius: 22,
    backgroundColor: BUBBLE_BG,
    paddingHorizontal: 18,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.035,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },

  bubbleTail: {
    position: "absolute",
    top: -8,
    left: 38,
    width: 18,
    height: 18,
    backgroundColor: BUBBLE_BG,
    transform: [{ rotate: "45deg" }],
    borderRadius: 4,
  },

  messageIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFF8EF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  messageIcon: {
    fontSize: 22,
  },

  messageTextBox: {
    flex: 1,
  },

  messageTitle: {
    color: TEXT,
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 2,
  },

  messageSub: {
    color: "#7F7164",
    fontSize: 12,
    fontWeight: "700",
  },
});