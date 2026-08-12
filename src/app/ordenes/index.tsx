import { View } from "react-native";
import { Text } from "@rneui/themed";
import { useAppTheme } from "../../contexts/AccessibilityThemeContext";

// Pantalla placeholder de ordenes; el modulo esta oculto en el menu inferior.
export default function OrdenesScreen() {
  const { colors: Colors } = useAppTheme();
  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream, padding: 24 }}>
      <Text h3 style={{ color: Colors.text }}>Ordenes</Text>
    </View>
  );
}
