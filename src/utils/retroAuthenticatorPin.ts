import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { sha1 } from "./totp";

const KEY_PREFIX = "retrogarage.otp_retro_pin.";

type PinRecord = {
  salt: string;
  hash: string;
};

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

const getRandomSalt = () => {
  const bytes = new Uint8Array(16);

  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const stringToBytes = (value: string) => {
  if (typeof TextEncoder !== "undefined") {
    return Array.from(new TextEncoder().encode(value));
  }

  return Array.from(value).map((char) => char.charCodeAt(0) & 0xff);
};

const bytesToHex = (bytes: number[]) =>
  bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");

const hashPin = (pin: string, salt: string) =>
  bytesToHex(sha1(stringToBytes(`${salt}:${pin}`)));

const setItem = async (key: string, value: string) => {
  if (isWeb) {
    getWebStorage()?.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
};

const getItem = async (key: string) => {
  if (isWeb) return getWebStorage()?.getItem(key) ?? null;
  return SecureStore.getItemAsync(key);
};

export const hasRetroAuthenticatorPin = async (accountKey: string) =>
  Boolean(await getItem(getStoreKey(accountKey)));

export const setupRetroAuthenticatorPin = async (
  accountKey: string,
  pin: string,
) => {
  const salt = getRandomSalt();
  const record: PinRecord = {
    salt,
    hash: hashPin(pin, salt),
  };

  await setItem(getStoreKey(accountKey), JSON.stringify(record));
};

export const verifyRetroAuthenticatorPin = async (
  accountKey: string,
  pin: string,
) => {
  const rawRecord = await getItem(getStoreKey(accountKey));
  if (!rawRecord) return false;

  try {
    const record = JSON.parse(rawRecord) as PinRecord;
    return hashPin(pin, record.salt) === record.hash;
  } catch {
    return false;
  }
};

