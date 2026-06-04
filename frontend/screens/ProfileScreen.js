import React, { useCallback, useState } from "react";
import { API_BASE_URL } from "../config/config";
import {
  clearAuthSession,
  getCurrentUser,
  getAccessToken,
} from "../auth/authStorage";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

const BG = "#FFFFFF";
const CARD_BG = "#F3EEE5";
const SOFT_CARD = "#FFF8E8";
const BROWN = "#6F4B23";
const DARK_BROWN = "#4E3214";
const EDIT_BROWN = "#D8C2A5";
const TEXT = "#1F1F1F";
const GRAY = "#8F877E";
const LINE = "rgba(111, 75, 35, 0.12)";

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [profile, setProfile] = useState(null);
  const [walkStats, setWalkStats] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const loadProfile = async () => {
        try {
          const user = await getCurrentUser();
          if (!user) return;

          const token = await getAccessToken();

          const res = await fetch(`${API_BASE_URL}/profiles/me/${user.id}`);
          const data = await res.json();
          console.log("profile data:", data);

          const statsRes = await fetch(`${API_BASE_URL}/paths/stats`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const statsData = await statsRes.json();

          if (!cancelled) {
            setProfile(data);
            setWalkStats(statsData);
          }
        } catch (e) {
          console.log(e);
        }
      };

      loadProfile();

      return () => {
        cancelled = true;
      };
    }, [])
  );

  const handleLogout = async () => {
    try {
      await clearAuthSession();

      let rootNavigation = navigation;
      while (rootNavigation.getParent()) {
        rootNavigation = rootNavigation.getParent();
      }

      rootNavigation.reset({
        index: 0,
        routes: [{ name: "Onboarding" }],
      });
    } catch (e) {
      console.log(e);
      Alert.alert("오류", "로그아웃 처리 중 오류가 발생했습니다.");
    }
  };

  const showLogoutConfirm = () => {
    Alert.alert("로그아웃", "로그아웃 하시겠습니까?", [
      { text: "취소", style: "cancel" },
      { text: "로그아웃", style: "destructive", onPress: handleLogout },
    ]);
  };

  const userName = profile?.user_profile?.nickname ?? "닉네임";
  const userGender =
    profile?.user_profile?.gender === "female" ? "여자" : "남자";
  const userAge = profile?.user_profile?.age ?? "-";
  const userPhone = profile?.user_profile?.emergency_contact ?? "-";

  const dogName = profile?.dog?.name ?? "반려견";
  const dogGender = profile?.dog?.gender === "female" ? "암컷" : "수컷";
  const dogAge = profile?.dog?.age ?? "-";
  const dogBreed = profile?.dog?.breed ?? "-";

  const weeklyDistance = (walkStats?.weekly?.distanceKm ?? 0).toFixed(2);
  const weeklyDuration = walkStats?.weekly?.duration ?? "0분";
  const monthlyDistance = (walkStats?.monthly?.distanceKm ?? 0).toFixed(2);
  const monthlyDuration = walkStats?.monthly?.duration ?? "0분";

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>마이 페이지</Text>
        </View>

        <Text style={styles.sectionTitle}>내 프로필</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            {profile?.user_profile?.image_url ? (
              <Image
                source={{ uri: profile.user_profile.image_url }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.defaultAvatar}>
                <View style={styles.avatarHead} />
                <View style={styles.avatarBody} />
              </View>
            )}
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.nameText}>{userName}</Text>
            <Text style={styles.infoText}>
              {userGender} / {userAge}세
            </Text>
            <Text style={styles.infoText}>{userPhone}</Text>

            <TouchableOpacity
              style={styles.editButton}
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate("ProfileEdit", { initialTab: "user" })
              }
            >
              <Text style={styles.editButtonText}>프로필 수정하기</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionEmoji}>💗</Text>
          <Text style={styles.sectionTitleNoMargin}>나의 반려동물</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.petAvatarOuter}>
            {profile?.dog?.image_url ? (
              <Image
                source={{ uri: profile.dog.image_url }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.petAvatarInner}>
                <Text style={styles.petFace}>🐶</Text>
              </View>
            )}
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.nameText}>{dogName}</Text>
            <Text style={styles.infoText}>
              {dogGender}({dogAge}세) / {dogBreed}
            </Text>

            <TouchableOpacity
              style={styles.editButton}
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate("ProfileEdit", { initialTab: "dog" })
              }
            >
              <Text style={styles.editButtonText}>프로필 수정하기</Text>
            </TouchableOpacity>
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

        <View style={styles.badgeCard}>
          <View style={styles.badgeIconBox}>
            <Text style={styles.badgeIcon}>🐾</Text>
          </View>

          <View style={styles.badgeTextBox}>
            <Text style={styles.badgeTitle}>이번 주도 산책 완료!</Text>
            <Text style={styles.badgeSub}>
              꾸준한 산책 기록이 쌓이고 있어요
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.85}
          onPress={showLogoutConfirm}
        >
          <Text style={styles.logoutButtonText}>로그아웃</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 64,
    paddingBottom: 34,
  },

  header: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  headerTitle: {
    color: BROWN,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  sectionTitle: {
    color: BROWN,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.2,
    marginBottom: 10,
    marginTop: 2,
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

  profileCard: {
    minHeight: 126,
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderRadius: 20,
    flexDirection: "row",
    paddingHorizontal: 18,
    paddingVertical: 17,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },

  avatarWrap: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: "#FFF3CA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 17,
    overflow: "hidden",
  },

  defaultAvatar: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarImage: {
    height: "100%",
    width: "100%",
  },

  avatarHead: {
    backgroundColor: "#D1C8B4",
    borderRadius: 999,
    height: 31,
    marginBottom: 7,
    width: 31,
  },

  avatarBody: {
    backgroundColor: "#D1C8B4",
    borderRadius: 999,
    height: 35,
    width: 60,
  },

  petAvatarOuter: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 17,
    overflow: "hidden",
  },

  petAvatarInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F5EEE5",
    justifyContent: "center",
    alignItems: "center",
  },

  petFace: {
    fontSize: 30,
  },

  cardContent: {
    flex: 1,
    justifyContent: "center",
  },

  nameText: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.4,
    marginBottom: 6,
  },

  infoText: {
    color: GRAY,
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 17,
  },

  editButton: {
    height: 28,
    minWidth: 128,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    backgroundColor: EDIT_BROWN,
    borderRadius: 999,
    marginTop: 8,
    paddingHorizontal: 14,
  },

  editButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  recordCard: {
    height: 86,
    borderRadius: 18,
    backgroundColor: SOFT_CARD,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
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
    color: BROWN,
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 5,
  },

  recordDistance: {
    color: TEXT,
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 2,
  },

  recordTime: {
    color: GRAY,
    fontSize: 11,
    fontWeight: "800",
  },

  recordDivider: {
    width: 1,
    height: 46,
    backgroundColor: LINE,
  },

  badgeCard: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: "#F7EFE4",
    paddingHorizontal: 15,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
  },

  badgeIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  badgeIcon: {
    fontSize: 20,
  },

  badgeTextBox: {
    flex: 1,
  },

  badgeTitle: {
    color: TEXT,
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 2,
  },

  badgeSub: {
    color: GRAY,
    fontSize: 11,
    fontWeight: "700",
  },

  logoutButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#D4C4A8",
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 20,
    paddingVertical: 13,
  },

  logoutButtonText: {
    color: BROWN,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
});