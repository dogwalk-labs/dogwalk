import React, { useCallback, useState } from "react";
import { API_BASE_URL } from "../config/config";
import { clearAuthSession, getCurrentUser, getAccessToken } from "../auth/authStorage";
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

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

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.backIcon}>‹</Text>
          <Text style={styles.headerTitle}>마이 페이지</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.sectionTitle}>내 프로필</Text>
        <View style={styles.card}>
          <View style={styles.avatarWrap}>
            {profile?.user_profile?.image_url ? (
              <Image source={{ uri: profile.user_profile.image_url }} style={styles.avatarImage} />
            ) : (
              <>
                <View style={styles.avatarHead} />
                <View style={styles.avatarBody} />
              </>
            )}
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.nameText}>
              {profile?.user_profile?.nickname ?? "닉네임"}
            </Text>
            <Text style={styles.infoText}>
              {profile?.user_profile?.gender === "female" ? "여자" : "남자"}
              {" / "}
              {profile?.user_profile?.age ?? "-"}세
            </Text>
            <Text style={styles.infoText}>
              {profile?.user_profile?.emergency_contact ?? "-"}
            </Text>
            <TouchableOpacity
              style={styles.editButton}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("ProfileEdit", { initialTab: "user" })}
            >
              <Text style={styles.editButtonText}>프로필 수정하기</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>💗 나의 반려동물</Text>
        <View style={styles.card}>
          <View style={styles.petAvatarOuter}>
            {profile?.dog?.image_url ? (
              <Image source={{ uri: profile.dog.image_url }} style={styles.avatarImage} />
            ) : (
              <View style={styles.petAvatarInner}>
                <Text style={styles.petFace}>🐶</Text>
              </View>
            )}
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.nameText}>
              {profile?.dog?.name ?? "반려견"}
            </Text>
            <Text style={styles.infoText}>
              {profile?.dog?.gender === "female" ? "암컷" : "수컷"}
              ({profile?.dog?.age ?? "-"}세) /{" "}
              {profile?.dog?.breed ?? "-"}
            </Text>
            <TouchableOpacity
              style={styles.editButton}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("ProfileEdit", { initialTab: "dog" })}
            >
              <Text style={styles.editButtonText}>프로필 수정하기2</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>🔥 '{profile?.dog?.name ?? "반려견"}'의 산책기록</Text>
        <View style={styles.walkCard}>
          <View style={styles.recordRow}>
            <Text style={styles.recordLabel}>주간</Text>
            <Text style={styles.recordValue}>
              {(walkStats?.weekly?.distanceKm ?? 0).toFixed(2)}km, {walkStats?.weekly?.duration ?? "0분"}
            </Text>
          </View>
          <View style={styles.recordRow}>
            <Text style={styles.recordLabel}>월간</Text>
            <Text style={styles.recordValue}>
              {(walkStats?.monthly?.distanceKm ?? 0).toFixed(2)}km, {walkStats?.monthly?.duration ?? "0분"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.8}
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
    backgroundColor: "#F5F5F5",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 36,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  backIcon: {
    color: "#8A8A8A",
    fontSize: 26,
    lineHeight: 26,
    width: 26,
  },
  headerTitle: {
    color: "#5F4729",
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  headerSpacer: {
    width: 26,
  },
  sectionTitle: {
    color: "#855617",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginBottom: 12,
    marginTop: 10,
  },
  card: {
    alignItems: "center",
    backgroundColor: "#EFEADF",
    borderRadius: 18,
    flexDirection: "row",
    marginBottom: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  avatarWrap: {
    alignItems: "center",
    backgroundColor: "#F3ECD4",
    borderRadius: 999,
    height: 120,
    justifyContent: "center",
    marginRight: 18,
    overflow: "hidden",
    width: 120,
  },
  avatarImage: {
    height: 120,
    width: 120,
  },
  avatarHead: {
    backgroundColor: "#D1C8B4",
    borderRadius: 999,
    height: 38,
    marginBottom: 6,
    width: 38,
  },
  avatarBody: {
    backgroundColor: "#D1C8B4",
    borderRadius: 999,
    height: 42,
    width: 72,
  },
  petAvatarOuter: {
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    borderRadius: 999,
    height: 120,
    justifyContent: "center",
    marginRight: 18,
    overflow: "hidden",
    width: 120,
  },
  petAvatarInner: {
    alignItems: "center",
    backgroundColor: "#F2ECE3",
    borderRadius: 999,
    height: 94,
    justifyContent: "center",
    width: 94,
  },
  petFace: {
    fontSize: 38,
  },
  cardContent: {
    flex: 1,
  },
  nameText: {
    color: "#141414",
    fontSize: 29,
    fontWeight: "700",
    letterSpacing: -0.8,
    marginBottom: 2,
  },
  infoText: {
    color: "#8A847C",
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 23,
  },
  editButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#E2E2E2",
    borderRadius: 999,
    marginTop: 10,
    minWidth: 158,
    paddingHorizontal: 18,
    paddingVertical: 6,
  },
  editButtonText: {
    color: "#818181",
    fontSize: 13,
    fontWeight: "600",
  },
  walkCard: {
    backgroundColor: "#EFEDE7",
    borderRadius: 18,
    marginTop: 2,
    paddingHorizontal: 22,
    paddingVertical: 20,
  },
  recordRow: {
    alignItems: "baseline",
    flexDirection: "row",
    marginBottom: 12,
  },
  recordLabel: {
    color: "#202020",
    fontSize: 22,
    fontWeight: "700",
    marginRight: 24,
    minWidth: 62,
  },
  recordValue: {
    color: "#948F86",
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: -0.5,
  },
  logoutButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#D4C4A8",
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 40,
    paddingVertical: 16,
  },
  logoutButtonText: {
    color: "#855617",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
});