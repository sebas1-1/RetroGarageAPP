import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// La version permite volver a mostrar el onboarding en el futuro si cambia por completo.
const ONBOARDING_KEY = "retrogarage.onboarding.v2.completed";

export const onboardingPreferences = {
  async hasCompleted(): Promise<boolean> {
    try {
      if (Platform.OS === "web") {
        if (typeof localStorage === "undefined") return false;
        return localStorage.getItem(ONBOARDING_KEY) === "true";
      }

      return (await SecureStore.getItemAsync(ONBOARDING_KEY)) === "true";
    } catch {
      // Si no se puede leer la preferencia, se ofrece el onboarding de nuevo.
      return false;
    }
  },

  async markCompleted(): Promise<void> {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(ONBOARDING_KEY, "true");
      }
      return;
    }

    await SecureStore.setItemAsync(ONBOARDING_KEY, "true");
  },
};
