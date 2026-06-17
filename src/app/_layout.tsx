import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import { Colors } from "../constants/colors";

// Este layout define la navegacion principal de la app con el menu inferior.
export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        // Estilos generales que comparten todas las opciones del menu.
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.gray,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          letterSpacing: 0.5,
        },
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: "600", letterSpacing: 2, fontSize: 14 },
        headerTitleAlign: "center",
      }}
    >
      {/* La ruta index carga el login, pero no debe aparecer en el menu. */}
      <Tabs.Screen
        name="index"
        options={{
          href: null,
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      />
      {/* Login queda oculto para que no se vea como una opcion del dashboard. */}
      <Tabs.Screen
        name="login"
        options={{
          href: null,
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      />
      {/* Inicio es la pantalla principal despues de acceder. */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Inicio",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      {/* Pantallas visibles del sistema administrativo. */}
      <Tabs.Screen
        name="clientes"
        options={{
          title: "Clientes",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventario"
        options={{
          title: "Inventario",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="inventory" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pagos"
        options={{
          title: "Pagos",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="payments" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="usuarios"
        options={{
          title: "Usuarios",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="manage-accounts" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="citas"
        options={{
          title: "Citas",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="event" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="servicios"
        options={{
          title: "Servicios",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="build" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="estadisticas"
        options={{
          title: "Estadísticas",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="bar-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="categorias"
        options={{
          title: "Categorías",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="category" size={size} color={color} />
          ),
        }}
      />
      {/* Ordenes existe en el proyecto, pero se oculta del menu inferior. */}
      <Tabs.Screen
        name="ordenes"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
