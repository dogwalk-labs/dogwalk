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

const BG = "#FBF3DD";
const TEXT = "#2B2B2B";
const BROWN = "#B08B5A";

function CheckboxRow({ label, checked, onToggle }) {
  return (
    <Pressable style={styles.checkboxRow} onPress={onToggle}>
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
            >
              <Text style={styles.backText}>←</Text>
            </Pressable>

            <Text style={styles.headerTitle}>회원 가입</Text>

            <View style={styles.headerRightSpacer} />
          </View>

          <View style={styles.content}>
            <Image
              source={require("../assets/registerPage_image.png")}
              style={styles.icon}
              resizeMode="contain"
            />

            <Text style={styles.subtitle}>
              반려동물과의 산책을 {"\n"} 더 편하게 만들어드릴께요
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
  container: { flex: 1, backgroundColor: BG },
  safeArea: { flex: 1, backgroundColor: BG },
  containerInner: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 0,
    paddingBottom: 8,
  },

  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnPressed: { transform: [{ scale: 0.96 }] },
  backText: {
    fontSize: 26,
    fontWeight: "900",
    color: "#777",
  },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 22,
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "900",
    color: TEXT,
    marginRight: 44, // back + spacer 폭 보정(시각적 중앙)
    marginLeft: 44,
  },

  headerRightSpacer: {
    width: 44,
    height: 44,
  },

  icon: {
    width: 410,
    height: 210,
    marginTop: 10,
  },

  subtitle: {
    marginTop: 14,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#8D867C",
    lineHeight: 22,
  },

  form: {
    width: "100%",
    marginTop: 22,
  },

  inputWrap: {
    width: "100%",
    marginBottom: 10,
  },
  input: {
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    fontSize: 15,
    fontWeight: "700",
    color: TEXT,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },

  checkboxList: {
    width: "100%",
    marginTop: 6,
    marginBottom: 18,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
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
    color: "#8D867C",
  },

  signupButton: {
    width: "100%",
    height: 56,
    borderRadius: 28,
    backgroundColor: BROWN,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginTop: 0,
  },
  signupButtonDisabled: { opacity: 0.55 },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.95,
  },
  signupButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
});

