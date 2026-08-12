import { View } from "react-native";
import { Text } from "@rneui/themed";
import { useAppTheme } from "../../contexts/AccessibilityThemeContext";

// Pantalla placeholder para crear ordenes si luego se reactiva este modulo.
export default function NuevaOrdenScreen() {
  const { colors: Colors } = useAppTheme();
  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream, padding: 24 }}>
      <Text h3 style={{ color: Colors.text }}>Nueva orden</Text>
    </View>
  );
}
