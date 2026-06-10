import { View } from "react-native";
import { Text } from "@rneui/themed";

export default function NuevaOrdenScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#F5F4F0", padding: 24 }}>
      <Text h3 style={{ color: "#2C2C2A" }}>Nueva orden</Text>
    </View>
  );
}