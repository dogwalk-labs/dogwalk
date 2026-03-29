import * as SecureStore from "expo-secure-store";

// TOKEN_KEY 는 인증을 위한 토큰 키키
const TOKEN_KEY = "dogwalk_access_token";
// USER_KEY 는 프론트 편의용으로 생성한 것
// ex)사용자정보 프론트에서 꺼내쓰기 (id, email, nickname)
const USER_KEY = "dogwalk_user_json";

export async function saveAuthSession({ access_token, id, email, nickname }) {
  await SecureStore.setItemAsync(TOKEN_KEY, access_token);
  await SecureStore.setItemAsync(
    USER_KEY,
    JSON.stringify({ id, email: email ?? null, nickname: nickname ?? null })
  );
}

export async function clearAuthSession() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

export async function getAccessToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}
