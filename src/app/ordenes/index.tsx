import { View } from "react-native";
import { Text } from "@rneui/themed";

// Pantalla placeholder de ordenes; el modulo esta oculto en el menu inferior.
export default function OrdenesScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#F5F4F0", padding: 24 }}>
      <Text h3 style={{ color: "#2C2C2A" }}>Ordenes</Text>
    </View>
  );
}
