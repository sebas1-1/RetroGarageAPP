import { Text } from "@rneui/themed";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../constants/colors";
import { fs, sp } from "../constants/responsive";

// Pantalla inicial: pide los datos de acceso antes de entrar al dashboard.
export default function LoginScreen() {
  const router = useRouter();

  // Guarda lo que el usuario escribe y si los campos estan activos.
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [correoFocused, setCorreoFocused] = useState(false);
  const [contrasenaFocused, setContrasenaFocused] = useState(false);

  const handleLogin = () => {
    // Por ahora solo redirige; aqui se conectaria la autenticacion real.
    router.replace("/dashboard" as any);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header oscuro (mismo patrón que saludoSection) ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>RETRO GARAGE</Text>
          <Text style={styles.headerSub}>CLASSIC CAR SHOP</Text>
          <View style={styles.headerDivider} />
        </View>

        {/* ── Cuerpo ── */}
        <View style={styles.body}>
          <Text style={styles.titulo}>Acceso administrativo</Text>
          <Text style={styles.subtitulo}>
            Ingresa tus credenciales para continuar
          </Text>

          {/* Correo */}
          <Text style={styles.sectionLabel}>CORREO ELECTRÓNICO</Text>
          <TextInput
            style={[styles.input, correoFocused && styles.inputFocused]}
            placeholder="usuario@retrogarage.com"
            placeholderTextColor={Colors.gray}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={correo}
            onChangeText={setCorreo}
            onFocus={() => setCorreoFocused(true)}
            onBlur={() => setCorreoFocused(false)}
          />

          {/* Contraseña */}
          <Text style={[styles.sectionLabel, { marginTop: sp(20) }]}>
            CONTRASEÑA
          </Text>
          <TextInput
            style={[styles.input, contrasenaFocused && styles.inputFocused]}
            placeholder="••••••••"
            placeholderTextColor={Colors.gray}
            secureTextEntry
            value={contrasena}
            onChangeText={setContrasena}
            onFocus={() => setContrasenaFocused(true)}
            onBlur={() => setContrasenaFocused(false)}
          />

          {/* Botón */}
          <TouchableOpacity
            style={styles.boton}
            onPress={handleLogin}
            activeOpacity={0.85}
          >
            <Text style={styles.botonTexto}>ENTRAR AL TALLER</Text>
          </TouchableOpacity>

          {/* Olvidé contraseña */}
          <TouchableOpacity
            onPress={() => {}}
            activeOpacity={0.7}
            style={styles.olvidasteBtn}
          >
            <Text style={styles.olvidaste}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>
        </View>

        {/* ── Footer ── */}
        <Text style={styles.footer}>© 2026 RETRO GARAGE</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Estilos visuales del login.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  scroll: {
    flexGrow: 1,
  },

  /* Header — mismo color que saludoSection del dashboard */
  header: {
    backgroundColor: Colors.primary,
    paddingTop: sp(56),
    paddingBottom: sp(36),
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: fs(22),
    fontWeight: "700",
    letterSpacing: 6,
  },
  headerSub: {
    color: "#B8B4D4",
    fontSize: fs(11),
    letterSpacing: 4,
    marginTop: sp(6),
  },
  headerDivider: {
    marginTop: sp(20),
    width: sp(32),
    height: 1.5,
    backgroundColor: "#5c5878",
  },

  /* Body */
  body: {
    flex: 1,
    paddingHorizontal: sp(20),
    paddingTop: sp(36),
    paddingBottom: sp(24),
  },
  titulo: {
    fontSize: fs(24),
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: sp(6),
  },
  subtitulo: {
    fontSize: fs(13),
    color: Colors.gray,
    marginBottom: sp(32),
  },

  /* Labels — mismo estilo que sectionLabel del dashboard */
  sectionLabel: {
    fontSize: fs(11),
    fontWeight: "600",
    color: Colors.gray,
    letterSpacing: 1.5,
    marginBottom: sp(8),
  },

  /* Inputs — mismo look que las tarjetas blancas con border */
  input: {
    backgroundColor: Colors.white,
    borderRadius: sp(10),
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: sp(16),
    paddingVertical: sp(14),
    fontSize: fs(15),
    color: Colors.primary,
  },
  inputFocused: {
    borderColor: Colors.primary,
  },

  /* Botón — fondo primary, mismo radio que las cards */
  boton: {
    backgroundColor: Colors.primary,
    borderRadius: sp(10),
    paddingVertical: sp(16),
    alignItems: "center",
    marginTop: sp(32),
    marginBottom: sp(20),
  },
  botonTexto: {
    color: Colors.cream,
    fontSize: fs(13),
    fontWeight: "700",
    letterSpacing: 3,
  },

  /* Olvidé contraseña */
  olvidasteBtn: {
    alignItems: "center",
  },
  olvidaste: {
    fontSize: fs(13),
    color: Colors.primary,
    textDecorationLine: "underline",
  },

  /* Footer */
  footer: {
    textAlign: "center",
    fontSize: fs(11),
    color: Colors.gray,
    marginTop: sp(24),
    marginBottom: sp(32),
    paddingHorizontal: sp(20),
  },
});
