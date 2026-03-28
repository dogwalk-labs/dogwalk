import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";

const API_BASE = "http://192.168.0.20:8080";

const BG = "#FBF3DD";
const TEXT = "#2B2B2B";
const BROWN = "#8E6A3D";
const LIGHT_BROWN = "#F5EBDD";
const BORDER = "#E2D3BB";
const BOT_BG = "#FFF9EE";
const SOFT_BROWN = "#6F5535";
const SUBTEXT = "#7F7467";
const CHIP_BG = "#FFF8EA";
const INPUT_BG = "#FFFDF8";

const QUICK_QUESTIONS = [
  "강아지가 초콜릿을 먹었어요",
  "산책은 하루에 얼마나 해야 하나요?",
  "강아지가 발을 자꾸 핥아요",
  "비 오는 날 산책은 어떻게 하나요?",
  "강아지에게 먹여도 되는 과일은?",
  "강아지 산책 준비물은 뭐가 있나요?",
];

export default function CommunityScreen() {
  const listRef = useRef(null);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      text: "안녕하세요 🐶\n반려견에 대해 궁금한 점을 편하게 물어봐 주세요!",
    },
  ]);

  const normalizedMessages = useMemo(
    () =>
      messages.map((msg) => ({
        ...msg,
        isUser: msg.role === "user",
      })),
    [messages]
  );

  const scrollToBottom = () => {
    setTimeout(() => {
      listRef.current?.scrollToEnd?.({ animated: true });
    }, 120);
  };

  const sendMessage = async (presetText) => {
    const text = (presetText ?? input).trim();
    if (!text || isLoading) return;

    const userMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    scrollToBottom();

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
        }),
      });

      const data = await res.json();

      console.log("CHAT STATUS:", res.status);
      console.log("CHAT DATA:", data);

      if (!res.ok) {
        throw new Error(data?.detail || data?.error || "챗봇 응답 실패");
      }

      const botMessage = {
        id: `${Date.now()}-bot`,
        role: "assistant",
        text: data?.answer || "답변을 불러오지 못했어요.",
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (e) {
      const msg = String(e?.message || "");

      const errorMessage = {
        id: `${Date.now()}-error`,
        role: "assistant",
        text: msg
          ? `지금은 답변을 가져오지 못했어요.\n오류: ${msg}`
          : "지금은 답변을 가져오지 못했어요.\n서버 상태를 확인해 주세요.",
      };

      setMessages((prev) => [...prev, errorMessage]);
      console.log("챗봇 호출 실패:", e?.message ?? e);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const renderMessage = ({ item }) => {
    return (
      <View
        style={[
          styles.messageRow,
          item.isUser ? styles.userRow : styles.botRow,
        ]}
      >
        {!item.isUser && <Text style={styles.botEmoji}>🐶</Text>}

        <View
          style={[
            styles.bubble,
            item.isUser ? styles.userBubble : styles.botBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              item.isUser ? styles.userMessageText : styles.botMessageText,
            ]}
          >
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  const ListHeader = () => (
    <View>
      <View style={styles.header}>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>DOG CARE CHAT</Text>
        </View>

        <Text style={styles.headerTitle}>멍멍 상담소</Text>
        <Text style={styles.headerDesc}>
          반려견에 대한 질문을 챗봇에게 물어보세요
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.quickWrap}>
        <Text style={styles.quickTitle}>자주 묻는 질문</Text>

        <View style={styles.quickList}>
          {QUICK_QUESTIONS.map((q) => (
            <Pressable
              key={q}
              style={({ pressed }) => [
                styles.quickChip,
                pressed && styles.quickChipPressed,
              ]}
              onPress={() => sendMessage(q)}
            >
              <Text style={styles.quickChipText}>{q}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.chatSectionHeader}>
        <Text style={styles.chatSectionTitle}>채팅</Text>
      </View>
    </View>
  );

  const ListFooter = () => (
    <>
      {isLoading && (
        <View style={styles.loadingWrap}>
          <View style={styles.loadingBubble}>
            <Text style={styles.loadingText}>답변 작성 중...</Text>
          </View>
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <FlatList
          ref={listRef}
          data={normalizedMessages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
        />

        <View style={styles.inputArea}>
          <View style={styles.inputBox}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="예: 강아지가 포도를 먹었어요"
              placeholderTextColor="#9E9488"
              multiline
              style={styles.input}
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.sendButton,
              pressed && styles.buttonPressed,
              isLoading && styles.sendButtonDisabled,
            ]}
            onPress={() => sendMessage()}
            disabled={isLoading}
          >
            <Text style={styles.sendButtonText}>전송</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  header: {
    paddingTop: 14,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#F2E4CC",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 10,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: SOFT_BROWN,
    letterSpacing: 0.6,
  },
  headerTitle: {
    fontSize: 27,
    fontWeight: "900",
    color: TEXT,
    letterSpacing: -0.3,
  },
  headerDesc: {
    marginTop: 7,
    marginBottom: 4,
    fontSize: 13,
    color: SUBTEXT,
    fontWeight: "600",
    lineHeight: 19,
  },

  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginHorizontal: 16,
    marginVertical: 10,
  },

  quickWrap: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  quickTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: BROWN,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  quickList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quickChip: {
    backgroundColor: CHIP_BG,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
    maxWidth: "100%",
  },
  quickChipPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  quickChipText: {
    color: "#6E604E",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },

  chatSectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 8,
  },
  chatSectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#8B7355",
  },

  chatContent: {
    paddingBottom: 120,
  },

  messageRow: {
    marginBottom: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  botRow: {
    justifyContent: "flex-start",
  },
  userRow: {
    justifyContent: "flex-end",
  },

  botEmoji: {
    fontSize: 20,
    marginRight: 7,
    marginBottom: 6,
  },

  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 22,
  },
  botBubble: {
    backgroundColor: BOT_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderBottomLeftRadius: 8,
  },
  userBubble: {
    backgroundColor: BROWN,
    borderBottomRightRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  messageText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
  },
  botMessageText: {
    color: TEXT,
  },
  userMessageText: {
    color: "#FFFFFF",
  },

  loadingWrap: {
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: 4,
  },
  loadingBubble: {
    alignSelf: "flex-start",
    backgroundColor: LIGHT_BROWN,
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  loadingText: {
    color: "#7B6D5B",
    fontSize: 13,
    fontWeight: "700",
  },

  inputArea: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  inputBox: {
    flex: 1,
    backgroundColor: INPUT_BG,
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  input: {
    minHeight: 54,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: TEXT,
  },
  sendButton: {
    height: 54,
    minWidth: 72,
    backgroundColor: BROWN,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
});
