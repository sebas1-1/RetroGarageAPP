import { Stack } from "expo-router";

// Navegacion interna de ordenes, aunque el modulo no se muestra en el menu.
export default function OrdenesLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
