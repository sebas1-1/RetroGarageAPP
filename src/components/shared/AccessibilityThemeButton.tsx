import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Text } from "@rneui/themed";
import {
  AccessibilityInfo,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../../contexts/AccessibilityThemeContext";
import { fs, sp } from "../../constants/responsive";

export function AccessibilityThemeButton() {
  const insets = useSafeAreaInsets();
  const { colors, highContrast, toggleHighContrast } = useAppTheme();

  const handlePress = () => {
    toggleHighContrast();
    AccessibilityInfo.announceForAccessibility(
      highContrast
        ? "Modo de alto contraste desactivado"
        : "Modo de alto contraste activado",
    );
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.layer, { top: Math.max(insets.top, 8) + sp(8) }]}
    >
      <TouchableOpacity
        accessibilityRole="switch"
        accessibilityState={{ checked: highContrast }}
        accessibilityLabel="Modo de alto contraste"
        accessibilityHint={
          highContrast
            ? "Desactiva los colores de alto contraste"
            : "Activa colores y bordes de mayor contraste"
        }
        activeOpacity={0.82}
        onPress={handlePress}
        style={[
          styles.button,
          {
            backgroundColor: highContrast ? colors.warningSoft : colors.white,
            borderColor: highContrast ? colors.warning : colors.borderStrong,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <MaterialIcons
          name={highContrast ? "contrast" : "visibility"}
          size={22}
          color={highContrast ? colors.warning : colors.primary}
        />
        {Platform.OS === "web" ? (
          <Text
            style={[
              styles.label,
              { color: highContrast ? colors.warning : colors.primary },
            ]}
          >
            {highContrast ? "CONTRASTE: SÍ" : "ALTO CONTRASTE"}
          </Text>
        ) : null}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: "absolute",
    right: sp(12),
    zIndex: 1000,
  },
  button: {
    minWidth: sp(46),
    minHeight: sp(46),
    borderRadius: sp(23),
    borderWidth: 2,
    paddingHorizontal: sp(11),
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: sp(7),
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  label: {
    fontSize: fs(9),
    fontWeight: "800",
    letterSpacing: 0.8,
  },
});
