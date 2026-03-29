import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";

const BG = "#FBF3DD";
const TEXT = "#2B2B2B";
const BROWN = "#B08B5A";

export default function LoginScreen({
  onBack,
  onLoginPress,
  onSignupPress,
  onForgotPress,
  submitting,
}) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  const canSubmit =
    email.trim().length > 0 && pw.trim().length > 0 && !submitting;

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

            <Text style={styles.headerTitle}>로그인</Text>

            <View style={styles.headerRightSpacer} />
          </View>

          <View style={styles.content}>
          <Image
            source={require("../assets/loginPage_dog.png")}
            style={styles.icon}
            resizeMode="contain"
          />
          <Text style={styles.title}> </Text>

          <View style={styles.inputWrap}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              placeholder="이메일을 입력해주세요"
              placeholderTextColor="#BDBDBD"
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputWrap}>
            <TextInput
              value={pw}
              onChangeText={setPw}
              style={styles.input}
              placeholder="비밀번호를 입력해주세요"
              placeholderTextColor="#BDBDBD"
              secureTextEntry
            />
          </View>

          <Pressable
            disabled={!canSubmit}
            style={({ pressed }) => [
              styles.loginButton,
              !canSubmit && styles.loginButtonDisabled,
              pressed && canSubmit && styles.buttonPressed,
            ]}
            onPress={() =>
              onLoginPress?.({ email: email.trim(), password: pw })
            }
          >
            <Text style={styles.loginButtonText}>
              {submitting ? "처리 중…" : "로그인"}
            </Text>
          </Pressable> 

          <View style={styles.hintWrap}>
            <Pressable
              style={({ pressed }) => [
                styles.forgotRow,
                pressed && styles.buttonPressed,
              ]}
              onPress={onForgotPress}
            >
              <Text style={styles.forgotText}>비밀번호를 잊으셨나요?</Text>
            </Pressable>

            <View style={styles.dividerLine} />

            <View style={styles.signupHintRow}>
              <Text style={styles.signupHintText}>
                아직 계정이 없으신가요?
              </Text>
              <Pressable
                onPress={onSignupPress}
                style={({ pressed }) => [
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.signupLinkText}>회원가입</Text>
              </Pressable>
            </View>
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
  },
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
  backBtnPressed: {
    transform: [{ scale: 0.96 }],
  },
  backText: {
    fontSize: 26,
    fontWeight: "900",
    color: "#777",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "900",
    color: TEXT,
    marginRight: 44,
    marginLeft: 44,
  },
  headerRightSpacer: {
    width: 44,
    height: 44,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  icon: {
    width: 280,
    height: 270,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: TEXT,
    marginBottom: 18,
  },
  inputWrap: {
    width: "100%",
    marginBottom: 12,
  },
  input: {
    height: 54,
    borderRadius: 27,
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    fontSize: 16,
    fontWeight: "700",
    color: TEXT,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  loginButton: {
    width: "100%",
    height: 58,
    borderRadius: 29,
    backgroundColor: BROWN,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  loginButtonDisabled: {
    opacity: 0.55,
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.95,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  hint: {
    marginTop: 14,
    fontSize: 13,
    color: "#AFA696",
    fontWeight: "700",
    textAlign: "center",
  },

  hintWrap: {
    marginTop: 16,
    alignItems: "center",
  },
  forgotRow: {
    paddingVertical: 2,
  },
  forgotText: {
    fontSize: 14,
    color: TEXT,
    fontWeight: "700",
    textAlign: "center",
  },
  dividerLine: {
    marginTop: 10,
    width: "100%",
    height: 1,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  signupHintRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  signupHintText: {
    fontSize: 14,
    color: "#AFA696",
    fontWeight: "700",
  },
  signupLinkText: {
    fontSize: 14,
    color: BROWN,
    fontWeight: "900",
  },
});

