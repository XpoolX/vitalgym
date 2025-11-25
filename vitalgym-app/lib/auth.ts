// lib/auth.ts
import * as SecureStore from "expo-secure-store";

const KEY = "vg_token";

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(KEY, token);
}

export async function saveUser(user: any) {
  await SecureStore.setItemAsync("user", JSON.stringify(user));
}

export async function getUser() {
  const u = await SecureStore.getItem("user");
  return u ? JSON.parse(u) : null;
}

export async function getToken() {
  try {
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}

export async function clearToken() {
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {}
}

