import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const TAB_USER = "user";
const TAB_DOG = "dog";
const formatPhoneNumber = (value) => {
  const numbers = value.replace(/[^0-9]/g, "").slice(0, 11);

  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
};

export default function ProfileEditScreen({ navigation, route }) {
  const initialTab = route?.params?.initialTab === TAB_DOG ? TAB_DOG : TAB_USER;
  const [activeTab, setActiveTab] = useState(initialTab);
  const [userName, setUserName] = useState("둥이누나");
  const [userAge, setUserAge] = useState("22");
  const [userGender, setUserGender] = useState("여자");
  const [emergencyContact, setEmergencyContact] = useState("010-1234-5678");
  const [dogName, setDogName] = useState("둥이");
  const [dogAge, setDogAge] = useState("7");
  const [dogGender, setDogGender] = useState("남자");
  const [dogBreed, setDogBreed] = useState("포메라니안");

  const isUserTab = useMemo(() => activeTab === TAB_USER, [activeTab]);

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
          style={styles.submitButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate("ProfileMain")}
        >
          <Text style={styles.submitButtonText}>수정 완료</Text>
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
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
});
