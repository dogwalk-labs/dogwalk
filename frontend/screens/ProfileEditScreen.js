import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_BASE_URL } from "../config/config";
import { getCurrentUser } from "../auth/authStorage";

const TAB_USER = "user";
const TAB_DOG = "dog";
const formatPhoneNumber = (value) => {
  const numbers = value.replace(/[^0-9]/g, "").slice(0, 11);

  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
};

const genderUiToApi = (label) => {
  if (label === "여자") return "female";
  if (label === "남자") return "male";
  return null;
};

export default function ProfileEditScreen({ navigation, route }) {
  const initialTab = route?.params?.initialTab === TAB_DOG ? TAB_DOG : TAB_USER;
  const [activeTab, setActiveTab] = useState(initialTab);
  const [userName, setUserName] = useState("");
  const [userAge, setUserAge] = useState("");
  const [userGender, setUserGender] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [dogName, setDogName] = useState("");
  const [dogAge, setDogAge] = useState("");
  const [dogGender, setDogGender] = useState("");
  const [dogBreed, setDogBreed] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const hadDogFromServer = useRef(false);

  const isUserTab = useMemo(() => activeTab === TAB_USER, [activeTab]);

  useEffect(() => {
    const loadProfile = async () => {
      setProfileReady(false);
      try {
        const user = await getCurrentUser();

        if (!user) return;

        const response = await fetch(`${API_BASE_URL}/profiles/me/${user.id}`);
        const data = await response.json();

        const userProfile = data?.user_profile;
        if (userProfile) {
          setUserName(userProfile.nickname ?? "");
          setUserAge(userProfile.age ? String(userProfile.age) : "");
          if (userProfile.gender === "female") setUserGender("여자");
          else if (userProfile.gender === "male") setUserGender("남자");
          setEmergencyContact(userProfile.emergency_contact ?? "");
        }

        const dogProfile = data?.dog;
        hadDogFromServer.current = !!dogProfile;
        if (dogProfile) {
          setDogName(dogProfile.name ?? "");
          setDogAge(dogProfile.age ? String(dogProfile.age) : "");
          if (dogProfile.gender === "female") setDogGender("여자");
          else if (dogProfile.gender === "male") setDogGender("남자");
          setDogBreed(dogProfile.breed ?? "");
        }
      } catch (error) {
        console.log(error);
      } finally {
        setProfileReady(true);
      }
    };

    loadProfile();
  }, []);

  const handleSubmit = async () => {
    const user = await getCurrentUser();
    if (!user) {
      Alert.alert("오류", "로그인 정보를 찾을 수 없습니다.");
      return;
    }

    const nickname = userName.trim();
    const ageNum = parseInt(userAge, 10);
    const userGenderApi = genderUiToApi(userGender);
    if (!nickname || !String(userAge).trim() || Number.isNaN(ageNum) || !userGenderApi || !emergencyContact.trim()) {
      Alert.alert("입력 확인", "내 정보의 이름, 나이, 성별, 비상 연락처를 모두 입력해 주세요.");
      return;
    }

    const shouldSaveDog = hadDogFromServer.current || dogName.trim().length > 0;
    if (shouldSaveDog) {
      const dogAgeNum = parseInt(dogAge, 10);
      const dogGenderApi = genderUiToApi(dogGender);
      const dname = dogName.trim();
      const dbreed = dogBreed.trim();
      if (!dname || !String(dogAge).trim() || Number.isNaN(dogAgeNum) || !dogGenderApi || !dbreed) {
        Alert.alert("입력 확인", "반려동물의 이름, 나이, 성별, 견종을 모두 입력해 주세요.");
        return;
      }
    }

    setSaving(true);
    try {
      const userRes = await fetch(`${API_BASE_URL}/profiles/user`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          nickname,
          age: ageNum,
          gender: userGenderApi,
          emergency_contact: emergencyContact.trim(),
        }),
      });
      const userErr = await userRes.json().catch(() => ({}));
      if (!userRes.ok) {
        const msg =
          typeof userErr.detail === "string"
            ? userErr.detail
            : "사용자 정보를 저장하지 못했습니다.";
        Alert.alert("저장 실패", msg);
        return;
      }

      if (shouldSaveDog) {
        const dogAgeNum = parseInt(dogAge, 10);
        const dogGenderApi = genderUiToApi(dogGender);
        const dogRes = await fetch(`${API_BASE_URL}/profiles/dog`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            name: dogName.trim(),
            age: dogAgeNum,
            gender: dogGenderApi,
            breed: dogBreed.trim(),
          }),
        });
        const dogErr = await dogRes.json().catch(() => ({}));
        if (!dogRes.ok) {
          const msg =
            typeof dogErr.detail === "string" ? dogErr.detail : "반려동물 정보를 저장하지 못했습니다.";
          Alert.alert("저장 실패", msg);
          return;
        }
      }

      navigation.navigate("ProfileMain");
    } catch (error) {
      console.log(error);
      Alert.alert("오류", "네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity hitSlop={8} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>프로필 수정</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.tabRow}>
          <TouchableOpacity activeOpacity={0.8} onPress={() => setActiveTab(TAB_USER)}>
            <Text style={[styles.tabText, isUserTab && styles.tabTextActive]}>내 정보</Text>
          </TouchableOpacity>
          <Text style={styles.tabDivider}>|</Text>
          <TouchableOpacity activeOpacity={0.8} onPress={() => setActiveTab(TAB_DOG)}>
            <Text style={[styles.tabText, !isUserTab && styles.tabTextActive]}>반려동물 정보</Text>
          </TouchableOpacity>
        </View>

        {isUserTab ? (
          <>
            <View style={styles.userAvatar}>
              <View style={styles.avatarHead} />
              <View style={styles.avatarBody} />
            </View>
            <View style={styles.photoButton}>
              <Text style={styles.photoButtonText}>사진 선택하기</Text>
            </View>

            <Text style={styles.sectionTitle}>상세 정보</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>이름</Text>
                <TextInput style={styles.infoInput} value={userName} onChangeText={setUserName} />
              </View>
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>나이</Text>
                <TextInput
                  style={styles.ageInput}
                  value={userAge}
                  onChangeText={(value) => setUserAge(value.replace(/[^0-9]/g, ""))}
                  keyboardType="number-pad"
                  maxLength={3}
                />
                <Text style={styles.rowDivider}>|</Text>
                <Text style={styles.infoLabel}>성별</Text>
                <View style={styles.genderSelector}>
                  <TouchableOpacity
                    style={[styles.genderOption, userGender === "여자" && styles.genderOptionActive]}
                    activeOpacity={0.8}
                    onPress={() => setUserGender("여자")}
                  >
                    <Text style={[styles.genderOptionText, userGender === "여자" && styles.genderOptionTextActive]}>
                      여자
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.genderOption, userGender === "남자" && styles.genderOptionActive]}
                    activeOpacity={0.8}
                    onPress={() => setUserGender("남자")}
                  >
                    <Text style={[styles.genderOptionText, userGender === "남자" && styles.genderOptionTextActive]}>
                      남자
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>비상 연락처</Text>
                <TextInput
                  style={styles.infoInput}
                  value={emergencyContact}
                  onChangeText={(value) => setEmergencyContact(formatPhoneNumber(value))}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.divider} />
            </View>
          </>
        ) : (
          <>
            <View style={styles.dogAvatarOuter}>
              <View style={styles.dogAvatarInner}>
                <Text style={styles.dogFace}>🐶</Text>
              </View>
            </View>
            <View style={styles.photoButton}>
              <Text style={styles.photoButtonText}>사진 선택하기</Text>
            </View>

            <Text style={styles.sectionTitle}>상세 정보</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>이름</Text>
                <TextInput style={styles.infoInput} value={dogName} onChangeText={setDogName} />
              </View>
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>나이</Text>
                <TextInput
                  style={styles.ageInput}
                  value={dogAge}
                  onChangeText={(value) => setDogAge(value.replace(/[^0-9]/g, ""))}
                  keyboardType="number-pad"
                  maxLength={3}
                />
                <Text style={styles.rowDivider}>|</Text>
                <Text style={styles.infoLabel}>성별</Text>
                <View style={styles.genderSelector}>
                  <TouchableOpacity
                    style={[styles.genderOption, dogGender === "여자" && styles.genderOptionActive]}
                    activeOpacity={0.8}
                    onPress={() => setDogGender("여자")}
                  >
                    <Text style={[styles.genderOptionText, dogGender === "여자" && styles.genderOptionTextActive]}>
                      여자
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.genderOption, dogGender === "남자" && styles.genderOptionActive]}
                    activeOpacity={0.8}
                    onPress={() => setDogGender("남자")}
                  >
                    <Text style={[styles.genderOptionText, dogGender === "남자" && styles.genderOptionTextActive]}>
                      남자
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>견종</Text>
                <TextInput style={styles.infoInput} value={dogBreed} onChangeText={setDogBreed} />
                
              </View>
              <View style={styles.divider} />
            </View>
          </>
        )}

        <TouchableOpacity
          style={[styles.submitButton, saving && styles.submitButtonDisabled]}
          activeOpacity={0.85}
          disabled={saving || !profileReady}
          onPress={handleSubmit}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>수정 완료</Text>
          )}
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
  content: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 28,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  backIcon: {
    color: "#8A8A8A",
    fontSize: 30,
    lineHeight: 30,
  },
  headerTitle: {
    color: "#5F4729",
    fontSize: 22,
    fontWeight: "700",
  },
  headerSpacer: {
    width: 20,
  },
  tabRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 26,
    marginBottom: 20,
  },
  tabText: {
    color: "#C8B9A0",
    fontSize: 18,
    fontWeight: "700",
  },
  tabTextActive: {
    color: "#6D4311",
  },
  tabDivider: {
    color: "#D6CCBE",
    fontSize: 18,
    marginHorizontal: 18,
  },
  userAvatar: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#F3ECD7",
    borderRadius: 999,
    height: 180,
    justifyContent: "center",
    width: 180,
  },
  avatarHead: {
    backgroundColor: "#D2C8B4",
    borderRadius: 999,
    height: 52,
    marginBottom: 8,
    width: 52,
  },
  avatarBody: {
    backgroundColor: "#D2C8B4",
    borderRadius: 999,
    height: 72,
    width: 110,
  },
  dogAvatarOuter: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#E7D9C2",
    borderRadius: 999,
    height: 180,
    justifyContent: "center",
    width: 180,
  },
  dogAvatarInner: {
    alignItems: "center",
    backgroundColor: "#F2ECE3",
    borderRadius: 999,
    height: 114,
    justifyContent: "center",
    width: 114,
  },
  dogFace: {
    fontSize: 52,
  },
  photoButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#E8E8E8",
    borderRadius: 999,
    marginTop: 14,
    marginBottom: 42,
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  photoButtonText: {
    color: "#9E9E9E",
    fontSize: 12,
    fontWeight: "600",
  },
  sectionTitle: {
    color: "#B08B5A",
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 12,
    marginLeft: 12,
  },
  infoCard: {
    backgroundColor: "#EFEDE7",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  infoRow: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 52,
  },
  infoLabel: {
    color: "#6D4311",
    fontSize: 16,
    fontWeight: "700",
    marginRight: 10,
  },
  infoInput: {
    color: "#9D927F",
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    paddingVertical: 0,
  },
  infoValue: {
    color: "#9D927F",
    fontSize: 16,
    fontWeight: "500",
  },
  ageInput: {
    color: "#9D927F",
    fontSize: 16,
    fontWeight: "500",
    minWidth: 24,
    paddingVertical: 0,
  },
  genderSelector: {
    flexDirection: "row",
    gap: 6,
  },
  genderOption: {
    borderColor: "#CFC4B0",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  genderOptionActive: {
    backgroundColor: "#E7D9C2",
    borderColor: "#B89767",
  },
  genderOptionText: {
    color: "#9D927F",
    fontSize: 13,
    fontWeight: "600",
  },
  genderOptionTextActive: {
    color: "#6D4311",
  },
  rowDivider: {
    color: "#9D927F",
    marginHorizontal: 14,
  },
  divider: {
    borderBottomColor: "#CFC4B0",
    borderBottomWidth: 1,
  },
  submitButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#B89767",
    borderRadius: 999,
    height: 56,
    justifyContent: "center",
    marginTop: 24,
    width: "78%",
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
});
