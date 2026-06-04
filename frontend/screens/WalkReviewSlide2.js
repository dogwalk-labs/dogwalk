// WalkReviewSlide2.js

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Image,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const BG = "#FBF3DD";
const TEXT = "#2B2B2B";

export default function WalkReviewSlide2({ onLike, onDislike }) {
  const [selected, setSelected] = useState(null);

  const handleLike = () => {
    setSelected("like");
    onLike?.();
  };

  const handleDislike = () => {
    setSelected("dislike");
    onDislike?.();
  };

  return (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <View style={styles.contentWrapper}>
        <View style={styles.graphicWrap}>
          <Image
            source={require("../assets/endScreen_star.png")}
            style={styles.graphicImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>산책 코스를 평가해주세요</Text>

        <View style={styles.buttonArea}>
          <Pressable
            onPress={handleLike}
            style={({ pressed }) => [
              styles.button,
              selected === "like" ? styles.likeBtnSelected : styles.likeBtn,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>좋아요</Text>
          </Pressable>

          <Pressable
            onPress={handleDislike}
            style={({ pressed }) => [
              styles.button,
              selected === "dislike"
                ? styles.dislikeBtnSelected
                : styles.dislikeBtn,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>아쉬워요</Text>
          </Pressable>

          <Text style={styles.hint}>
            평가는 다음 코스 추천에 반영돼요!
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  // 전체를 위로 이동
  contentWrapper: {
    alignItems: "center",
    width: "100%",
    transform: [{ translateY: 0 }],
  },

  graphicWrap: {
    marginBottom: -20,
  },

  graphicImage: {
    width: 320,
    height: 210,
  },

  title: {
    fontSize: 27,
    fontWeight: "800",
    color: TEXT,
    marginBottom: 28,
    textAlign: "center",
  },

  buttonArea: {
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },

  button: {
    width: "100%",
    maxWidth: 280,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },

  buttonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.95,
  },

  likeBtn: {
    backgroundColor: "#ffa2bb",
  },

  likeBtnSelected: {
    backgroundColor: "#f27ea1",
  },

  dislikeBtn: {
    backgroundColor: "#9ad2ec",
  },

  dislikeBtnSelected: {
    backgroundColor: "#69b8df",
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  hint: {
    marginTop: 18,
    fontSize: 13,
    color: "#666",
    textAlign: "center",
  },
});