import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const KEY_PREFIX = "retrogarage.otp_retro_secret.";

const encodeAccountKey = (accountKey: string) => {
  const normalized = accountKey.trim().toLowerCase();

  if (typeof btoa === "function") {
    return btoa(normalized)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  return normalized.replace(/[^A-Za-z0-9._-]/g, "_");
};

const getStoreKey = (accountKey: string) =>
  `${KEY_PREFIX}${encodeAccountKey(accountKey)}`;

const isWeb = Platform.OS === "web";

const getWebStorage = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage;
};

export const saveRetroAuthenticatorSecret = async (
  accountKey: string,
  secret: string,
) => {
  if (isWeb) {
    getWebStorage()?.setItem(getStoreKey(accountKey), secret);
    return;
  }

  await SecureStore.setItemAsync(getStoreKey(accountKey), secret);
};

export const getRetroAuthenticatorSecret = async (accountKey: string) => {
  if (isWeb) {
    return getWebStorage()?.getItem(getStoreKey(accountKey)) ?? null;
  }

  return SecureStore.getItemAsync(getStoreKey(accountKey));
};
