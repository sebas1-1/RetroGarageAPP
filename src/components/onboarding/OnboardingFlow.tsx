import { useThemedStyles } from "@/contexts/AccessibilityThemeContext";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image as ExpoImage } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { AppColors } from "../../constants/colors";
import { fs, sp } from "../../constants/responsive";
import { onboardingPreferences } from "../../services/onboardingPreferences";

type OnboardingFlowProps = { onComplete: () => void };
const TOTAL_SLIDES = 3;

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { colors: Colors, styles } = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [slide, setSlide] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const finish = async () => {
    if (saving) return;
    setSaving(true);
    setSaveError("");
    try {
      await onboardingPreferences.markCompleted();
      onComplete();
    } catch {
      setSaveError("No pudimos guardar esta preferencia. Inténtalo nuevamente.");
      setSaving(false);
    }
  };

  const goNext = () => {
    if (slide < TOTAL_SLIDES - 1) setSlide((current) => current + 1);
    else void finish();
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View
        style={[
          styles.shell,
          width >= 800 && styles.shellWide,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.visualPanel}>
          {slide === 0 && (
            <>
              <ExpoImage
                source={require("../../../assets/images/pexels-marcel-condurachi-765466373-35828311.jpg")}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                contentPosition="center"
                transition={250}
                accessibilityLabel="Automóviles clásicos dentro de un taller"
              />
              <View style={styles.imageOverlay} />
            </>
          )}

          <View style={styles.topBar}>
            <View style={styles.brandRow}>
              <View style={styles.brandMark} />
              <Text style={styles.brand}>RETRO GARAGE</Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Omitir introducción e ir al inicio de sesión"
              onPress={() => void finish()}
              disabled={saving}
              style={styles.skipButton}
            >
              <Text style={styles.skipText}>Omitir</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.visualContent}>
            {slide === 0 && <WelcomeVisual />}
            {slide === 1 && (
              <ExpoImage
                source={require("../../../assets/images/onboarding/operations.png")}
                style={styles.screenshotComposition}
                contentFit="contain"
                transition={250}
                accessibilityLabel="Vistas de Citas y Servicios de Retro Garage"
              />
            )}
            {slide === 2 && (
              <ExpoImage
                source={require("../../../assets/images/onboarding/insights.png")}
                style={styles.screenshotComposition}
                contentFit="contain"
                transition={250}
                accessibilityLabel="Vistas de Inicio y Estadísticas de Retro Garage"
              />
            )}
          </View>
        </View>

        <View style={styles.contentPanel}>
          <View
            accessible
            accessibilityLiveRegion="polite"
            accessibilityLabel={`Pantalla ${slide + 1} de ${TOTAL_SLIDES}`}
            style={styles.progressRow}
          >
            {Array.from({ length: TOTAL_SLIDES }, (_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index === slide && styles.progressDotActive,
                ]}
              />
            ))}
          </View>

          <SlideCopy slide={slide} />

          {saveError ? (
            <Text accessibilityRole="alert" style={styles.errorText}>
              {saveError}
            </Text>
          ) : null}

          <View style={styles.actions}>
            {slide > 0 ? (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Volver a la pantalla anterior"
                onPress={() => setSlide((current) => current - 1)}
                disabled={saving}
                style={styles.backButton}
              >
                <MaterialIcons name="arrow-back" size={20} color={Colors.primary} />
                <Text style={styles.backText}>Atrás</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.backPlaceholder} />
            )}

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={
                slide === TOTAL_SLIDES - 1
                  ? "Comenzar e ir al inicio de sesión"
                  : "Ir a la siguiente pantalla"
              }
              onPress={goNext}
              disabled={saving}
              style={[styles.primaryButton, saving && styles.buttonDisabled]}
            >
              {saving ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>
                    {slide === TOTAL_SLIDES - 1 ? "Comenzar" : "Siguiente"}
                  </Text>
                  <MaterialIcons
                    name={slide === TOTAL_SLIDES - 1 ? "login" : "arrow-forward"}
                    size={20}
                    color={Colors.white}
                  />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

function SlideCopy({ slide }: { slide: number }) {
  const { styles } = useThemedStyles(createStyles);
  const content = [
    {
      eyebrow: "BIENVENIDO",
      title: "La gestión del taller, más clara",
      description:
        "Retro Garage reúne clientes, citas, inventario y cobros en un solo lugar confiable.",
    },
    {
      eyebrow: "SIMPLE Y EFICAZ",
      title: "Tu taller bajo control",
      description:
        "Encuentra cada tarea rápidamente y completa los procesos con pasos claros, sin pantallas innecesarias.",
    },
    {
      eyebrow: "DISEÑO QUE INFORMA",
      title: "Decisiones con confianza",
      description:
        "Inicio y Estadísticas son las vistas más visuales: resumen lo importante y permiten comparar el desempeño por mes.",
    },
  ][slide];

  return (
    <View style={styles.copyBlock}>
      <Text style={styles.eyebrow}>{content.eyebrow}</Text>
      <Text style={styles.title}>{content.title}</Text>
      <Text style={styles.description}>{content.description}</Text>
    </View>
  );
}

function WelcomeVisual() {
  const { styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.welcomeBadge}>
      <MaterialIcons name="directions-car" size={32} color="#FFFFFF" />
      <Text style={styles.welcomeBadgeText}>CLASSIC CAR SHOP</Text>
    </View>
  );
}

const createStyles = (Colors: AppColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.primaryDark },
    shell: { flex: 1, backgroundColor: Colors.cream },
    shellWide: {
      width: "100%",
      maxWidth: 820,
      alignSelf: "center",
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: Colors.borderStrong,
    },
    visualPanel: {
      flex: 1.3,
      minHeight: sp(330),
      backgroundColor: Colors.primary,
      overflow: "hidden",
    },
    imageOverlay: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: Colors.loginOverlay,
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: sp(22),
      paddingRight: Platform.OS === "web" ? sp(155) : sp(76),
      paddingTop: sp(14),
      zIndex: 2,
    },
    brandRow: { flexDirection: "row", alignItems: "center", gap: sp(9) },
    brandMark: {
      width: sp(18),
      height: sp(3),
      borderRadius: sp(2),
      backgroundColor: Colors.accent,
    },
    brand: {
      color: Colors.white,
      fontSize: fs(12),
      fontWeight: "800",
      letterSpacing: 2,
    },
    skipButton: {
      minHeight: sp(44),
      justifyContent: "center",
      paddingHorizontal: sp(8),
    },
    skipText: { color: Colors.white, fontSize: fs(13), fontWeight: "700" },
    visualContent: { flex: 1, alignItems: "center", justifyContent: "center" },
    welcomeBadge: {
      alignItems: "center",
      gap: sp(10),
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.45)",
      backgroundColor: "rgba(9,27,44,0.36)",
      borderRadius: sp(16),
      paddingHorizontal: sp(30),
      paddingVertical: sp(18),
    },
    welcomeBadgeText: {
      color: "#FFFFFF",
      fontSize: fs(11),
      fontWeight: "700",
      letterSpacing: 3,
    },
    screenshotComposition: {
      height: "100%",
      aspectRatio: 2 / 3,
      maxWidth: "92%",
    },
    contentPanel: {
      flex: 0.7,
      backgroundColor: Colors.cream,
      borderTopLeftRadius: sp(26),
      borderTopRightRadius: sp(26),
      marginTop: sp(-25),
      paddingHorizontal: sp(25),
      paddingTop: sp(22),
      paddingBottom: sp(18),
      justifyContent: "space-between",
      zIndex: 3,
    },
    progressRow: { flexDirection: "row", gap: sp(7), alignSelf: "center" },
    progressDot: {
      width: sp(8),
      height: sp(8),
      borderRadius: sp(4),
      backgroundColor: Colors.borderStrong,
    },
    progressDotActive: { width: sp(28), backgroundColor: Colors.accent },
    copyBlock: { width: "100%", maxWidth: 600, alignSelf: "center", gap: sp(9) },
    eyebrow: {
      color: Colors.accent,
      fontSize: fs(11),
      fontWeight: "800",
      letterSpacing: 2,
    },
    title: {
      color: Colors.primary,
      fontSize: fs(25),
      lineHeight: fs(32),
      fontWeight: "800",
    },
    description: { color: Colors.gray, fontSize: fs(14), lineHeight: fs(21) },
    errorText: { color: Colors.danger, fontSize: fs(12), textAlign: "center" },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: sp(12),
      width: "100%",
      maxWidth: 600,
      alignSelf: "center",
    },
    backButton: {
      minHeight: sp(48),
      flexDirection: "row",
      alignItems: "center",
      gap: sp(6),
      paddingHorizontal: sp(8),
    },
    backPlaceholder: { width: sp(76) },
    backText: { color: Colors.primary, fontSize: fs(13), fontWeight: "700" },
    primaryButton: {
      minWidth: sp(150),
      minHeight: sp(50),
      borderRadius: sp(10),
      backgroundColor: Colors.accent,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: sp(8),
      paddingHorizontal: sp(22),
      shadowColor: Colors.shadow,
      shadowOpacity: 0.18,
      shadowRadius: 6,
      elevation: 4,
    },
    buttonDisabled: { opacity: 0.65 },
    primaryButtonText: { color: Colors.white, fontSize: fs(14), fontWeight: "800" },
  });
