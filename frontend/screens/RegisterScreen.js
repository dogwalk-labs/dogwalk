import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  SafeAreaView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const BG = "#FBF3DD";
const TEXT = "#2B2B2B";
const BROWN = "#B08B5A";
const SUBTEXT = "#8D867C";
const BORDER = "rgba(84, 50, 208, 0.12)";

function CheckboxRow({ label, checked, onToggle }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.checkboxRow,
        pressed && styles.checkboxRowPressed,
      ]}
      onPress={onToggle}
    >
      <View style={[styles.checkboxBox, checked && styles.checkboxBoxOn]}>
        {checked ? <Text style={styles.checkboxCheck}>✓</Text> : null}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </Pressable>
  );
}

export default function RegisterScreen({ onBack, onSignupPress }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const canSubmit = useMemo(() => {
    if (email.trim().length === 0) return false;
    if (pw.trim().length === 0) return false;
    if (pwConfirm.trim().length === 0) return false;
    if (pw !== pwConfirm) return false;
    if (!agreeTerms) return false;
    if (!agreePrivacy) return false;
    return true;
  }, [email, pw, pwConfirm, agreeTerms, agreePrivacy]);

  const derivedNickname = useMemo(() => {
    const at = email.indexOf("@");
    if (at > 0) return email.slice(0, at);
    if (email.trim().length > 0) return email.trim();
    return "user";
  }, [email]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.containerInner}>
          <View style={styles.header}>
            <Pressable
              style={({ pressed }) => [
                styles.backBtn,
                pressed && styles.backBtnPressed,
              ]}
              onPress={onBack}
              hitSlop={12}
            >
              <Ionicons name="chevron-back" size={28} color={TEXT} />
            </Pressable>

            <Text style={styles.headerTitle}>회원 가입</Text>

            <View style={styles.headerRightSpacer} />
          </View>

          <View style={styles.content}>
            <View style={styles.hero}>
              <Image
                source={require("../assets/registerPage_image.png")}
                style={styles.icon}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.title}>멍멍워크와 함께{"\n"}산책을 시작해볼까요?</Text>

            <Text style={styles.subtitle}>
              반려동물과의 산책을{"\n"}더 편하게 만들어드릴게요
            </Text>

            <View style={styles.form}>
              <View style={styles.inputWrap}>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                  placeholder="아이디 생성"
                  placeholderTextColor="#BDBDBD"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputWrap}>
                <TextInput
                  value={pw}
                  onChangeText={setPw}
                  style={styles.input}
                  placeholder="비밀번호 생성"
                  placeholderTextColor="#BDBDBD"
                  secureTextEntry
                />
              </View>

              <View style={styles.inputWrap}>
                <TextInput
                  value={pwConfirm}
                  onChangeText={setPwConfirm}
                  style={styles.input}
                  placeholder="비밀번호 확인"
                  placeholderTextColor="#BDBDBD"
                  secureTextEntry
                />
              </View>

              <View style={styles.checkboxList}>
                <CheckboxRow
                  label="서비스 이용약관(필수)"
                  checked={agreeTerms}
                  onToggle={() => setAgreeTerms((v) => !v)}
                />
                <CheckboxRow
                  label="개인정보 수집동의(필수)"
                  checked={agreePrivacy}
                  onToggle={() => setAgreePrivacy((v) => !v)}
                />
              </View>

              <Pressable
                disabled={!canSubmit}
                style={({ pressed }) => [
                  styles.signupButton,
                  !canSubmit && styles.signupButtonDisabled,
                  pressed && canSubmit && styles.buttonPressed,
                ]}
                onPress={() =>
                  onSignupPress?.({
                    email,
                    password: pw,
                    password_confirm: pwConfirm,
                    nickname: derivedNickname,
                  })
                }
              >
                <Text style={styles.signupButtonText}>회원 가입</Text>
              </Pressable>
            </View>
          </View>
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

  containerInner: {
    flex: 1,
    backgroundColor: BG,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingTop: 4,
    paddingBottom: 8,
  },

  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  backBtnPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.92,
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "900",
    color: TEXT,
    marginHorizontal: 8,
  },

  headerRightSpacer: {
    width: 44,
    height: 44,
  },

  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 22,
    paddingTop: 4,
  },

  hero: {
    alignItems: "center",
    marginTop: 8,
  },

  icon: {
    width: 300,
    height: 200,
  },

  title: {
    marginTop: 4,
    textAlign: "center",
    fontSize: 26,
    fontWeight: "900",
    color: TEXT,
    lineHeight: 34,
  },

  subtitle: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: SUBTEXT,
    lineHeight: 22,
  },

  form: {
    width: "100%",
    marginTop: 24,
  },

  inputWrap: {
    width: "100%",
    marginBottom: 12,
  },

  input: {
    height: 52,
    borderRadius: 999,
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    fontSize: 15,
    fontWeight: "700",
    color: TEXT,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  checkboxList: {
    width: "100%",
    marginTop: 6,
    marginBottom: 22,
    gap: 10,
  },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  checkboxRowPressed: {
    opacity: 0.85,
  },

  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  checkboxBoxOn: {
    backgroundColor: "#E9D6C1",
    borderColor: "#E0C5A1",
  },

  checkboxCheck: {
    fontSize: 14,
    fontWeight: "900",
    color: "#8B6A49",
  },

  checkboxLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: SUBTEXT,
  },

  signupButton: {
    width: "100%",
    height: 68,
    borderRadius: 18,
    backgroundColor: BROWN,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  signupButtonDisabled: {
    opacity: 0.55,
  },

  buttonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.94,
  },

  signupButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
  },
});