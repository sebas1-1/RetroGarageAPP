import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import { Colors } from "../constants/colors";

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
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
        headerStyle: {
          backgroundColor: Colors.primary,
        },
        headerTintColor: Colors.cream,
        headerTitleStyle: { fontWeight: "600", letterSpacing: 2, fontSize: 14 },
        headerTitleAlign: "center",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="clientes"
        options={{
          title: "Clientes",
          headerShown: false,
          headerTitle: "RETRO GARAGE",
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
          headerTitle: "RETRO GARAGE",
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
          headerTitle: "RETRO GARAGE",
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
          headerTitle: "RETRO GARAGE",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="manage-accounts" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ordenes"
        options={{
          title: "Órdenes",
          headerShown: false,
          headerTitle: "RETRO GARAGE",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="assignment" size={size} color={color} />
          ),
          href: null,
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
    </Tabs>
  );
}
