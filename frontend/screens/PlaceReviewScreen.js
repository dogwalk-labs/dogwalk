import React, { useCallback, useState } from "react"; // useMemo → useCallback, useState 추가
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator, // 추가
} from "react-native";
import { useFocusEffect } from "@react-navigation/native"; // 추가
import { API_BASE_URL } from "../config/config"; // 추가 (reviewStore 제거)

const BG = "#FFFFFF";
const CARD_BG = "#FFF9ED";
const BROWN = "#B08B5A";

function Stars({ count = 0 }) {
  const rating = Math.max(0, Math.min(5, Number(count) || 0));
  return (
    <Text style={styles.stars}>
      {"★".repeat(rating)}
      {"☆".repeat(5 - rating)}
    </Text>
  );
}

export default function PlaceReviewScreen({ navigation, route }) {
  const poiId = route?.params?.poiId;
  const poiTitle = route?.params?.poiTitle ?? "리뷰 보기";
  const poiAddress = route?.params?.poiAddress ?? "";
  // refreshKey 제거 (useFocusEffect로 자동 새로고침)

  const [reviews, setReviews] = useState([]); // 추가
  const [loading, setLoading] = useState(true); // 추가

  // reviewStore → API 연동으로 변경
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const loadReviews = async () => {
        try {
          setLoading(true);
          const res = await fetch(`${API_BASE_URL}/places/${poiId}/reviews`);
          const data = await res.json();
          if (!cancelled) setReviews(data.reviews ?? []);
        } catch (e) {
          console.error("리뷰 로드 실패:", e);
        } finally {
          if (!cancelled) setLoading(false);
        }
      };

      loadReviews();
      return () => { cancelled = true; };
    }, [poiId])
  );

  const goToUserProfile = (review) => {
    navigation.navigate("UserProfile", {
      userId: review.userId, // review.userId ?? review.id → review.userId로 변경
      userName: review.userName,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.popToTop();
            }
          }}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>리뷰 보기</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.placeInfoBox}>
          <Text style={styles.placeName}>{poiTitle}</Text>
          {!!poiAddress && <Text style={styles.placeAddress}>{poiAddress}</Text>}
        </View>

        {/* 로딩 표시 추가 */}
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={BROWN} />
        ) : reviews.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>아직 작성된 리뷰가 없어요</Text>
            <Text style={styles.emptyText}>첫 번째 리뷰를 작성해보세요!</Text>
          </View>
        ) : (
          // MOCK_LEADERBOARD.map → reviews.map으로 변경
          reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewTop}>
                <Pressable
                  style={({ pressed }) => [styles.profileCircle, pressed && styles.buttonPressed]}
                  onPress={() => goToUserProfile(review)}
                >
                  <Text style={styles.profileIcon}>👤</Text>
                </Pressable>
                <View style={styles.reviewUserInfo}>
                  <Text style={styles.reviewName}>{review.userName}</Text>
                  <Text style={styles.reviewDate}>{review.date}</Text>
                </View>
                <Pressable
                  style={({ pressed }) => [styles.profileButton, pressed && styles.buttonPressed]}
                  onPress={() => goToUserProfile(review)}
                >
                  <Text style={styles.profileButtonText}>프로필 보기</Text>
                </Pressable>
              </View>
              <Stars count={review.rating} />
              <Text style={styles.reviewContent}>{review.content}</Text>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.bottomArea}>
        <Pressable
          style={({ pressed }) => [styles.writeButton, pressed && styles.buttonPressed]}
          onPress={() =>
            navigation.navigate("PlaceReview2", { poiId, poiTitle, poiAddress })
          }
        >
          <Text style={styles.writeButtonText}>리뷰 작성하기</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  header: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  backButton: { width: 42, height: 42, justifyContent: "center" },
  backText: { fontSize: 36, color: "#B4A89A", lineHeight: 38 },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "900",
    color: "#6F4B23",
  },
  headerRight: { width: 42 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 28, paddingTop: 16, paddingBottom: 130 },
  placeInfoBox: { marginBottom: 18, alignItems: "center" },
  placeName: { fontSize: 18, fontWeight: "900", color: "#2B2B2B" },
  placeAddress: { marginTop: 5, fontSize: 12, color: "#9A9288", textAlign: "center" },
  emptyBox: { marginTop: 72, alignItems: "center" },
  emptyTitle: { fontSize: 17, fontWeight: "900", color: "#6F4B23" },
  emptyText: { marginTop: 8, fontSize: 13, fontWeight: "700", color: "#AAA39C" },
  reviewCard: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 18,
    marginBottom: 22,
  },
  reviewTop: { flexDirection: "row", alignItems: "center" },
  profileCircle: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "#F4E6D2",
    alignItems: "center",
    justifyContent: "center",
  },
  profileIcon: { fontSize: 23 },
  reviewUserInfo: { marginLeft: 10, flex: 1 },
  reviewName: { fontSize: 13, fontWeight: "900", color: "#6D6258" },
  reviewDate: { marginTop: 3, fontSize: 11, color: "#9C9187" },
  profileButton: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: "#EEECE8",
  },
  profileButtonText: { fontSize: 9, fontWeight: "800", color: "#AAA39C" },
  stars: { marginTop: 12, fontSize: 17, color: "#FFB800", letterSpacing: 1 },
  reviewContent: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 20,
    fontWeight: "700",
    color: "#6A5A4A",
  },
  bottomArea: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 34,
    alignItems: "center",
  },
  writeButton: {
    width: 210,
    height: 52,
    borderRadius: 26,
    backgroundColor: BROWN,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  writeButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  buttonPressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
});