import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from "react-native";
import { API_BASE_URL } from "../config/config";

const BG = "#FFFFFF";
const CARD_BG = "#FFF8E8";
const LIGHT_CARD = "#FFFCF6";
const BROWN = "#6F4B23";
const GRAY = "#A59B91";

export default function UserPublicProfileScreen({ navigation, route }) {
  const userId = route?.params?.userId;
  const [profile, setProfile] = useState(null);
  const [walkStats, setWalkStats] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const userName = profile?.user_profile?.nickname ?? route?.params?.userName ?? "유저명";
  const dogName = profile?.dog?.name ?? "반려견";
  const dogBreed = profile?.dog?.breed ?? "-";
  const dogAge = profile?.dog?.age ?? "-";
  const dogGender = profile?.dog?.gender === "female" ? "암컷" : "수컷";

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator style={{ marginTop: 100 }} color={BROWN} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>프로필</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>👤</Text>
          </View>
          <View>
            <Text style={styles.userName}>{userName}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>💕 '{userName}'의 반려동물</Text>
        <View style={styles.dogCard}>
          <View style={styles.dogAvatar}>
            <Text style={styles.dogEmoji}>🐶</Text>
          </View>
          <View>
            <Text style={styles.dogName}>{dogName}</Text>
            <Text style={styles.dogInfo}>{dogGender}({dogAge}세), {dogBreed}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>🔥 '{dogName}'의 산책기록</Text>
        <View style={styles.recordCard}>
          <View style={styles.recordRow}>
            <Text style={styles.recordLabel}>주간</Text>
             <Text style={styles.recordValue}>
              {walkStats?.weekly?.distanceKm ?? 0}km, {walkStats?.weekly?.duration ?? "0분"}</Text>
          </View>
          <View style={styles.recordRow}>
            <Text style={styles.recordLabel}>월간</Text>
            <Text style={styles.recordValue}>
              {walkStats?.monthly?.distanceKm ?? 0}km, {walkStats?.monthly?.duration ?? "0분"}</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },
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
    color: BROWN,
  },
  headerRight: {
    width: 42,
  },
  content: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 18,
  },
  userCard: {
    height: 100,
    borderRadius: 8,
    backgroundColor: LIGHT_CARD,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    marginBottom: 28,
  },
  userAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#FFE6E1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 18,
  },
  userAvatarText: {
    fontSize: 38,
  },
  userName: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111111",
    marginBottom: 6,
  },
  userInfo: {
    fontSize: 12,
    fontWeight: "700",
    color: GRAY,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: BROWN,
    marginBottom: 12,
    marginLeft: 6,
  },
  dogCard: {
    height: 112,
    borderRadius: 8,
    backgroundColor: CARD_BG,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 26,
    marginBottom: 28,
  },
  dogAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 22,
  },
  dogEmoji: {
    fontSize: 38,
  },
  dogName: {
    fontSize: 19,
    fontWeight: "900",
    color: "#111111",
    marginBottom: 8,
  },
  dogInfo: {
    fontSize: 12,
    fontWeight: "700",
    color: GRAY,
    marginBottom: 3,
  },
  recordCard: {
    height: 96,
    borderRadius: 8,
    backgroundColor: LIGHT_CARD,
    justifyContent: "center",
    paddingHorizontal: 38,
  },
  recordRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
  },
  recordLabel: {
    width: 44,
    fontSize: 15,
    fontWeight: "900",
    color: "#111111",
  },
  recordValue: {
    fontSize: 14,
    fontWeight: "800",
    color: GRAY,
  },
});