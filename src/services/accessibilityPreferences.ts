import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const HIGH_CONTRAST_KEY = "retrogarage.highContrast";

export const accessibilityPreferences = {
  async getHighContrast(): Promise<boolean> {
    try {
      if (Platform.OS === "web") {
        if (typeof localStorage === "undefined") return false;
        return localStorage.getItem(HIGH_CONTRAST_KEY) === "true";
      }

      return (await SecureStore.getItemAsync(HIGH_CONTRAST_KEY)) === "true";
    } catch {
      return false;
    }
  },

  async setHighContrast(enabled: boolean): Promise<void> {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(HIGH_CONTRAST_KEY, String(enabled));
      }
      return;
    }

    await SecureStore.setItemAsync(HIGH_CONTRAST_KEY, String(enabled));
  },
};
