import { Stack } from "expo-router";

// Navegacion interna de clientes: lista, nuevo y editar sin header automatico.
export default function ClientesLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
