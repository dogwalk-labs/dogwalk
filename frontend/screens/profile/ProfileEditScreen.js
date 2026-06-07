import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "../../config/config";
import { getCurrentUser } from "../../auth/authStorage";
import { resolveProfileImageUrl } from "../../lib/uploadProfileImage";

const TAB_USER = "user";
const TAB_DOG = "dog";

const BG = "#F5F5F5";
const DOG_BG = "#FAF6F4";

const DARK_BROWN = "#4E3214";
const HEADER_BROWN = "#3F260F";
const LIGHT_BROWN = "#B89767";
const MUTED = "#8F877E";
const LINE = "#CFC4B0";
const CARD = "#EFEDE7";

const DOG_DARK = "#745650";
const DOG_LIGHT = "#e5a99e";
const DOG_LINE = "#D8C4BC";
const DOG_CARD = "#F4ECE8";
const DOG_AVATAR = "#eadad8";
const DOG_AVATAR_INNER = "#F6EFEC";

const TAB_WIDTH = 132;
const TAB_HEIGHT = 38;

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
  const [userPhotoUri, setUserPhotoUri] = useState(null);
  const [dogPhotoUri, setDogPhotoUri] = useState(null);

  const hadDogFromServer = useRef(false);
  const tabAnim = useRef(
    new Animated.Value(initialTab === TAB_DOG ? TAB_WIDTH : 0)
  ).current;

  const isUserTab = useMemo(() => activeTab === TAB_USER, [activeTab]);

  const activeDark = isUserTab ? DARK_BROWN : DOG_DARK;
  const activeLight = isUserTab ? LIGHT_BROWN : DOG_LIGHT;
  const activeLine = isUserTab ? LINE : DOG_LINE;
  const activeCard = isUserTab ? CARD : DOG_CARD;
  const activeInputColor = isUserTab ? MUTED : "#8F7F79";

  const moveTab = (tab) => {
    setActiveTab(tab);

    Animated.spring(tabAnim, {
      toValue: tab === TAB_DOG ? TAB_WIDTH : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 80,
    }).start();
  };

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

          if (userProfile.image_url) {
            setUserPhotoUri(userProfile.image_url);
          }
        }

        const dogProfile = data?.dog;
        hadDogFromServer.current = !!dogProfile;

        if (dogProfile) {
          setDogName(dogProfile.name ?? "");
          setDogAge(dogProfile.age ? String(dogProfile.age) : "");

          if (dogProfile.gender === "female") setDogGender("여자");
          else if (dogProfile.gender === "male") setDogGender("남자");

          setDogBreed(dogProfile.breed ?? "");

          if (dogProfile.image_url) {
            setDogPhotoUri(dogProfile.image_url);
          }
        }
      } catch (error) {
        console.log(error);
      } finally {
        setProfileReady(true);
      }
    };

    loadProfile();
  }, []);

  const pickPhoto = async (setPhotoUri) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("권한 필요", "사진을 선택하려면 앨범 접근 권한을 허용해 주세요.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    const user = await getCurrentUser();

    if (!user) {
      Alert.alert("오류", "로그인 정보를 찾을 수 없습니다.");
      return;
    }

    const nickname = userName.trim();
    const ageNum = parseInt(userAge, 10);
    const userGenderApi = genderUiToApi(userGender);

    if (
      !nickname ||
      !String(userAge).trim() ||
      Number.isNaN(ageNum) ||
      !userGenderApi ||
      !emergencyContact.trim()
    ) {
      Alert.alert(
        "입력 확인",
        "내 정보의 이름, 나이, 성별, 비상 연락처를 모두 입력해 주세요."
      );
      return;
    }

    const shouldSaveDog = hadDogFromServer.current || dogName.trim().length > 0;

    if (shouldSaveDog) {
      const dogAgeNum = parseInt(dogAge, 10);
      const dogGenderApi = genderUiToApi(dogGender);
      const dname = dogName.trim();
      const dbreed = dogBreed.trim();

      if (
        !dname ||
        !String(dogAge).trim() ||
        Number.isNaN(dogAgeNum) ||
        !dogGenderApi ||
        !dbreed
      ) {
        Alert.alert(
          "입력 확인",
          "반려동물의 이름, 나이, 성별, 견종을 모두 입력해 주세요."
        );
        return;
      }
    }

    setSaving(true);

    try {
      const userImageUrl = await resolveProfileImageUrl(
        user.id,
        userPhotoUri,
        "user"
      );

      const dogImageUrl = shouldSaveDog
        ? await resolveProfileImageUrl(user.id, dogPhotoUri, "dog")
        : null;

      const userRes = await fetch(`${API_BASE_URL}/profiles/user`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          nickname,
          age: ageNum,
          gender: userGenderApi,
          emergency_contact: emergencyContact.trim(),
          image_url: userImageUrl,
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
            image_url: dogImageUrl,
          }),
        });

        const dogErr = await dogRes.json().catch(() => ({}));

        if (!dogRes.ok) {
          const msg =
            typeof dogErr.detail === "string"
              ? dogErr.detail
              : "반려동물 정보를 저장하지 못했습니다.";
          Alert.alert("저장 실패", msg);
          return;
        }
      }

      navigation.navigate("ProfileMain");
    } catch (error) {
      console.log(error);

      const message =
        error?.message?.includes("row-level security") ||
        error?.message?.includes("new row violates")
          ? "사진 업로드 권한이 없습니다. Supabase Storage policy를 확인해 주세요."
          : "저장 중 오류가 발생했습니다.";

      Alert.alert("오류", message);
    } finally {
      setSaving(false);
    }
  };

  const renderGenderOption = (label, value, setValue) => {
    const active = value === label;

    return (
      <TouchableOpacity
        style={[
          styles.genderOption,
          { borderColor: activeLine },
          active && {
            backgroundColor: isUserTab ? "#E7D9C2" : "#F0E4DF",
            borderColor: activeLight,
          },
        ]}
        activeOpacity={0.8}
        onPress={() => setValue(label)}
      >
        <Text style={[styles.genderOptionText, active && { color: activeDark }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isUserTab ? BG : DOG_BG }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            hitSlop={8}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={28} color="#B4A89A" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>프로필 수정</Text>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.topArea}>
          <View style={styles.tabBox}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.tabIndicator,
                {
                  backgroundColor: isUserTab ? "#FFFFFF" : "#F7EFEB",
                  transform: [{ translateX: tabAnim }],
                },
              ]}
            />

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => moveTab(TAB_USER)}
              style={styles.tabButton}
            >
              <Text
                style={[
                  styles.tabText,
                  isUserTab && styles.userTabTextActive,
                ]}
              >
                내 정보
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => moveTab(TAB_DOG)}
              style={styles.tabButton}
            >
              <Text
                style={[
                  styles.tabText,
                  !isUserTab && styles.dogTabTextActive,
                ]}
              >
                반려동물 정보
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.imageArea}>
            {isUserTab ? (
              <View style={styles.userAvatar}>
                {userPhotoUri ? (
                  <Image
                    source={{ uri: userPhotoUri }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <>
                    <View style={styles.avatarHead} />
                    <View style={styles.avatarBody} />
                  </>
                )}
              </View>
            ) : (
              <View
                style={[
                  styles.dogAvatarOuter,
                  { backgroundColor: DOG_AVATAR },
                ]}
              >
                {dogPhotoUri ? (
                  <Image
                    source={{ uri: dogPhotoUri }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View
                    style={[
                      styles.dogAvatarInner,
                      { backgroundColor: DOG_AVATAR_INNER },
                    ]}
                  >
                    <Text style={styles.dogFace}>🐶</Text>
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.photoButton,
                !isUserTab && { backgroundColor: "#EFE7E3" },
              ]}
              activeOpacity={0.8}
              onPress={() =>
                pickPhoto(isUserTab ? setUserPhotoUri : setDogPhotoUri)
              }
            >
              <Text
                style={[
                  styles.photoButtonText,
                  !isUserTab && { color: DOG_DARK },
                ]}
              >
                사진 선택하기
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: activeDark }]}>
          상세 정보
        </Text>

        <View style={[styles.infoCard, { backgroundColor: activeCard }]}>
          {isUserTab ? (
            <>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: activeDark }]}>
                  이름
                </Text>
                <TextInput
                  style={[styles.infoInput, { color: activeInputColor }]}
                  value={userName}
                  onChangeText={setUserName}
                />
              </View>

              <View style={[styles.divider, { borderBottomColor: activeLine }]} />

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: activeDark }]}>
                  나이
                </Text>
                <TextInput
                  style={[styles.ageInput, { color: activeInputColor }]}
                  value={userAge}
                  onChangeText={(value) =>
                    setUserAge(value.replace(/[^0-9]/g, ""))
                  }
                  keyboardType="number-pad"
                  maxLength={3}
                />

                <Text style={[styles.rowDivider, { color: activeInputColor }]}>
                  |
                </Text>

                <Text style={[styles.infoLabel, { color: activeDark }]}>
                  성별
                </Text>

                <View style={styles.genderSelector}>
                  {renderGenderOption("여자", userGender, setUserGender)}
                  {renderGenderOption("남자", userGender, setUserGender)}
                </View>
              </View>

              <View style={[styles.divider, { borderBottomColor: activeLine }]} />

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: activeDark }]}>
                  비상 연락처
                </Text>
                <TextInput
                  style={[styles.infoInput, { color: activeInputColor }]}
                  value={emergencyContact}
                  onChangeText={(value) =>
                    setEmergencyContact(formatPhoneNumber(value))
                  }
                  keyboardType="phone-pad"
                />
              </View>

              <View style={[styles.divider, { borderBottomColor: activeLine }]} />
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: activeDark }]}>
                  이름
                </Text>
                <TextInput
                  style={[styles.infoInput, { color: activeInputColor }]}
                  value={dogName}
                  onChangeText={setDogName}
                />
              </View>

              <View style={[styles.divider, { borderBottomColor: activeLine }]} />

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: activeDark }]}>
                  나이
                </Text>
                <TextInput
                  style={[styles.ageInput, { color: activeInputColor }]}
                  value={dogAge}
                  onChangeText={(value) =>
                    setDogAge(value.replace(/[^0-9]/g, ""))
                  }
                  keyboardType="number-pad"
                  maxLength={3}
                />

                <Text style={[styles.rowDivider, { color: activeInputColor }]}>
                  |
                </Text>

                <Text style={[styles.infoLabel, { color: activeDark }]}>
                  성별
                </Text>

                <View style={styles.genderSelector}>
                  {renderGenderOption("여자", dogGender, setDogGender)}
                  {renderGenderOption("남자", dogGender, setDogGender)}
                </View>
              </View>

              <View style={[styles.divider, { borderBottomColor: activeLine }]} />

              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: activeDark }]}>
                  견종
                </Text>
                <TextInput
                  style={[styles.infoInput, { color: activeInputColor }]}
                  value={dogBreed}
                  onChangeText={setDogBreed}
                />
              </View>

              <View style={[styles.divider, { borderBottomColor: activeLine }]} />
            </>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: activeLight },
            saving && styles.submitButtonDisabled,
          ]}
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
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 62,
    paddingBottom: 28,
  },

  header: {
    height: 42,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    transform: [{ translateY: 2 }],
  },

  backButton: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  headerTitle: {
    color: HEADER_BROWN,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  headerSpacer: {
    width: 42,
  },

  topArea: {
    transform: [{ translateY: -4 }],
  },

  tabBox: {
    alignSelf: "center",
    flexDirection: "row",
    backgroundColor: "#EDE7DC",
    borderRadius: 999,
    padding: 4,
    marginTop: 20,
    marginBottom: 18,
    position: "relative",
    overflow: "hidden",
  },

  tabIndicator: {
    position: "absolute",
    top: 4,
    left: 4,
    width: TAB_WIDTH,
    height: TAB_HEIGHT,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  tabButton: {
    width: TAB_WIDTH,
    height: TAB_HEIGHT,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    zIndex: 1,
  },

  tabText: {
    color: "#72563A",
    fontSize: 14,
    fontWeight: "900",
  },

  userTabTextActive: {
    color: HEADER_BROWN,
  },

  dogTabTextActive: {
    color: DOG_DARK,
  },

  imageArea: {
    transform: [{ translateY: 22 }],
  },

  userAvatar: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#F3ECD7",
    borderRadius: 999,
    height: 180,
    justifyContent: "center",
    overflow: "hidden",
    width: 180,
  },

  avatarImage: {
    height: 180,
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
    borderRadius: 999,
    height: 180,
    justifyContent: "center",
    overflow: "hidden",
    width: 180,
  },

  dogAvatarInner: {
    alignItems: "center",
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
    marginTop: 12,
    marginBottom: 42,
    paddingHorizontal: 20,
    paddingVertical: 5,
  },

  photoButtonText: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "800",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 10,
    marginLeft: 12,
  },

  infoCard: {
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
    fontSize: 15,
    fontWeight: "900",
    marginRight: 10,
  },

  infoInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    paddingVertical: 0,
  },

  ageInput: {
    fontSize: 15,
    fontWeight: "800",
    minWidth: 24,
    paddingVertical: 0,
  },

  genderSelector: {
    flexDirection: "row",
    gap: 6,
  },

  genderOption: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  genderOptionText: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "800",
  },

  rowDivider: {
    marginHorizontal: 14,
  },

  divider: {
    borderBottomWidth: 1,
  },

  submitButton: {
    alignItems: "center",
    alignSelf: "center",
    borderRadius: 999,
    height: 54,
    justifyContent: "center",
    marginTop: 20,
    width: "78%",
  },

  submitButtonDisabled: {
    opacity: 0.7,
  },

  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },
});