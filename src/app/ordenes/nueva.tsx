import { View } from "react-native";
import { Text } from "@rneui/themed";
import { Colors } from "../../constants/colors";

// Pantalla placeholder para crear ordenes si luego se reactiva este modulo.
export default function NuevaOrdenScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.cream, padding: 24 }}>
      <Text h3 style={{ color: Colors.text }}>Nueva orden</Text>
    </View>
  );
}
