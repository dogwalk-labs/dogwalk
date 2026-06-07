import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { API_BASE_URL } from "../../config/config";

const BG = "#FBF3DD";
const BROWN = "#B99A73";
const DARK = "#4A3A2A";

export default function ForgotPasswordScreen({ onBack, onVerified }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const requestCode = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      Alert.alert("입력 오류", "이메일을 입력해 주세요.");
      return;
    }

    try {
      setSending(true);

      const res = await fetch(`${API_BASE_URL}/auth/password-reset/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        Alert.alert(
          "이메일 확인 실패",
          data.detail || "가입이 확인되지 않은 이메일입니다. 다시 입력해주세요!"
        );
        return;
      }

      setCodeSent(true);
      Alert.alert("안내", "인증번호를 전송하였습니다.");
    } catch (e) {
      console.log("password reset request error:", e);
      Alert.alert("오류", "네트워크 오류가 발생했습니다.");
    } finally {
      setSending(false);
    }
  };

  const verifyCode = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      Alert.alert("입력 오류", "이메일을 입력해 주세요.");
      return;
    }

    if (!code.trim()) {
      Alert.alert("입력 오류", "인증번호를 입력해 주세요.");
      return;
    }

    try {
      setVerifying(true);

      const res = await fetch(`${API_BASE_URL}/auth/password-reset/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          code: code.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        Alert.alert("인증 실패", data.detail || "인증번호가 일치하지 않습니다.");
        return;
      }

      onVerified(cleanEmail);
    } catch (e) {
      console.log("password reset verify error:", e);
      Alert.alert("오류", "네트워크 오류가 발생했습니다.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>‹</Text>
      </TouchableOpacity>

      <Text style={styles.title}>비밀번호 찾기</Text>

      <Text style={styles.label}>가입한 이메일</Text>
      <TextInput
        style={styles.input}
        placeholder="이메일을 입력해주세요"
        placeholderTextColor="#AFA7A0"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={requestCode}
        disabled={sending}
      >
        {sending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>인증메일 보내기</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.label}>인증번호</Text>
      <TextInput
        style={styles.input}
        placeholder="인증번호를 입력해주세요"
        placeholderTextColor="#AFA7A0"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
      />

      <TouchableOpacity
        style={[styles.button, !codeSent && styles.disabledButton]}
        onPress={verifyCode}
        disabled={!codeSent || verifying}
      >
        {verifying ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>인증번호 확인</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 28,
    paddingTop: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  backText: {
    fontSize: 36,
    color: "#B8A28A",
  },
  title: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: DARK,
    marginBottom: 45,
  },
  label: {
    fontSize: 14,
    color: DARK,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    height: 46,
    backgroundColor: "#fff",
    borderRadius: 23,
    paddingHorizontal: 18,
    fontSize: 14,
    color: DARK,
    borderWidth: 1,
    borderColor: "#E4D8C8",
    marginBottom: 14,
  },
  button: {
    height: 48,
    borderRadius: 24,
    backgroundColor: BROWN,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});