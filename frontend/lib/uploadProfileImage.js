import { supabase } from "./supabase";

const PROFILE_PHOTOS_BUCKET = "profile-photos";

const isLocalImageUri = (uri) =>
  typeof uri === "string" &&
  !uri.startsWith("http://") &&
  !uri.startsWith("https://");

async function uriToArrayBuffer(uri) {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error("사진 파일을 읽지 못했습니다.");
  }
  return response.arrayBuffer();
}

export async function uploadProfileImage(userId, localUri, type) {
  if (!userId || !localUri) {
    throw new Error("업로드 정보가 올바르지 않습니다.");
  }
  if (type !== "user" && type !== "dog") {
    throw new Error("프로필 사진 종류가 올바르지 않습니다.");
  }

  const path = `${type}s/${userId}.jpg`;
  const fileData = await uriToArrayBuffer(localUri);

  const { error } = await supabase.storage.from(PROFILE_PHOTOS_BUCKET).upload(path, fileData, {
    upsert: true,
    contentType: "image/jpeg",
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(PROFILE_PHOTOS_BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function resolveProfileImageUrl(userId, uri, type) {
  if (!uri) return null;
  if (!isLocalImageUri(uri)) {
    return uri.split("?")[0];
  }
  return uploadProfileImage(userId, uri, type);
}
