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

export default function ResetPasswordScreen({ email, onBack, onComplete }) {
  const [newPassword, setNewPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const changePassword = async () => {
    if (newPassword.length < 8) {
      Alert.alert("비밀번호 오류", "비밀번호는 최소 8자 이상 입력해 주세요.");
      return;
    }

    if (newPassword !== passwordConfirm) {
      Alert.alert("비밀번호 오류", "비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/auth/password-reset/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          new_password: newPassword,
          new_password_confirm: passwordConfirm,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        Alert.alert("변경 실패", data.detail || "비밀번호 변경에 실패했습니다.");
        return;
      }

      Alert.alert("완료", "비밀번호가 변경되었습니다. 다시 로그인해 주세요.", [
        { text: "확인", onPress: onComplete },
      ]);
    } catch (e) {
      console.log("password reset confirm error:", e);
      Alert.alert("오류", "네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>‹</Text>
      </TouchableOpacity>

      <Text style={styles.title}>새 비밀번호 설정</Text>

      <Text style={styles.emailText}>{email}</Text>

      <Text style={styles.label}>새 비밀번호</Text>
      <TextInput
        style={styles.input}
        placeholder="새 비밀번호를 입력해주세요"
        placeholderTextColor="#AFA7A0"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />

      <Text style={styles.label}>새 비밀번호 확인</Text>
      <TextInput
        style={styles.input}
        placeholder="새 비밀번호를 다시 입력해주세요"
        placeholderTextColor="#AFA7A0"
        value={passwordConfirm}
        onChangeText={setPasswordConfirm}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={changePassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>비밀번호 변경</Text>
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
    marginBottom: 36,
  },
  emailText: {
    textAlign: "center",
    color: "#7B6A58",
    fontSize: 14,
    marginBottom: 25,
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
    marginTop: 14,
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});