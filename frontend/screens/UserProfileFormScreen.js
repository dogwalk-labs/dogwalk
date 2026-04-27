import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

const BG = "#FBF3DD";
const TEXT = "#2B2B2B";
const BROWN = "#B08B5A";

export default function UserProfileFormScreen({ onNextPress }) {
  const [nickname, setNickname] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  const canSubmit = useMemo(() => {
    return (
      nickname.trim().length > 0 &&
      age.trim().length > 0 &&
      gender.trim().length > 0 &&
      emergencyContact.trim().length > 0
    );
  }, [nickname, age, gender, emergencyContact]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.title}>사용자 정보를{"\n"}입력해주세요!</Text>

          <View style={styles.inputWrap}>
            <Text style={styles.label}>닉네임</Text>
            <TextInput
              value={nickname}
              onChangeText={setNickname}
              style={styles.input}
              placeholder="닉네임을 입력해주세요"
              placeholderTextColor="#BDBDBD"
            />
          </View>

          <View style={styles.inputWrap}>
            <Text style={styles.label}>나이</Text>
            <TextInput
              value={age}
              onChangeText={setAge}
              style={styles.input}
              placeholder="나이를 입력해주세요"
              placeholderTextColor="#BDBDBD"
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.inputWrap}>
            <Text style={styles.label}>성별</Text>
            <View style={styles.genderRow}>
              <Pressable
                style={[
                  styles.genderButton,
                  gender === "male" && styles.genderButtonActive,
                ]}
                onPress={() => setGender("male")}
              >
                <Text
                  style={[
                    styles.genderText,
                    gender === "male" && styles.genderTextActive,
                  ]}
                >
                  남성
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.genderButton,
                  gender === "female" && styles.genderButtonActive,
                ]}
                onPress={() => setGender("female")}
              >
                <Text
                  style={[
                    styles.genderText,
                    gender === "female" && styles.genderTextActive,
                  ]}
                >
                  여성
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.inputWrap}>
            <Text style={styles.label}>비상연락처</Text>
            <TextInput
              value={emergencyContact}
              onChangeText={setEmergencyContact}
              style={styles.input}
              placeholder="비상연락처를 입력해주세요"
              placeholderTextColor="#BDBDBD"
              keyboardType="phone-pad"
            />
          </View>

          <Pressable
            disabled={!canSubmit}
            style={({ pressed }) => [
              styles.submitButton,
              !canSubmit && styles.submitButtonDisabled,
              pressed && canSubmit && styles.buttonPressed,
            ]}
            onPress={onNextPress}
          >
            <Text style={styles.submitButtonText}>반려견 프로필 생성</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: TEXT,
    lineHeight: 44,
    marginBottom: 28,
    textAlign: "center",
  },
  inputWrap: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "800",
    color: "#786F62",
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    height: 52,
    borderRadius: 16,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: "700",
    color: TEXT,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  genderRow: {
    flexDirection: "row",
    gap: 10,
  },
  genderButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  genderButtonActive: {
    backgroundColor: "#E9D6C1",
    borderColor: "#D3AE7B",
  },
  genderText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#7A746A",
  },
  genderTextActive: {
    color: "#6F4B23",
  },
  submitButton: {
    marginTop: 18,
    height: 58,
    borderRadius: 29,
    backgroundColor: BROWN,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    opacity: 0.55,
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.94,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
});
