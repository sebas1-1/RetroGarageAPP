import { useThemedStyles } from "@/contexts/AccessibilityThemeContext";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { OnboardingFlow } from "../components/onboarding/OnboardingFlow";
import type { AppColors } from "../constants/colors";
import { getCurrentUserId } from "../services/authSession";
import { onboardingPreferences } from "../services/onboardingPreferences";
import LoginScreen from "./login";

type InitialScreen = "loading" | "onboarding" | "login";

// La primera visita muestra tres pantallas introductorias; las siguientes van al login.
export default function IndexScreen() {
  const { colors: Colors, styles } = useThemedStyles(createStyles);
  const router = useRouter();
  const [screen, setScreen] = useState<InitialScreen>("loading");

  // La ruta inicial contiene el acceso, pero nunca debe reaparecer al
  // retroceder mientras exista una sesion autenticada.
  useFocusEffect(
    useCallback(() => {
      if (getCurrentUserId() !== null) {
        router.replace("/dashboard" as any);
      }
    }, [router]),
  );

  useEffect(() => {
    let active = true;
    void onboardingPreferences.hasCompleted().then((completed) => {
      if (active) setScreen(completed ? "login" : "onboarding");
    });
    return () => {
      active = false;
    };
  }, []);

  if (screen === "loading") {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (screen === "onboarding") {
    return <OnboardingFlow onComplete={() => setScreen("login")} />;
  }

  return <LoginScreen />;
}

const createStyles = (Colors: AppColors) =>
  StyleSheet.create({
    loading: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: Colors.primary,
    },
  });
