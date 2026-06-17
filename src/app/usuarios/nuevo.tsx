import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Input, Text } from "@rneui/themed";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { MessageDialog } from "../../components/shared/MessageDialog";
import { Colors } from "../../constants/colors";
import { fs, sp } from "../../constants/responsive";
import { Rol, usuariosService } from "../../services/usuariosService";

// Pantalla para crear un usuario administrativo.
export default function NuevoUsuarioScreen() {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [form, setForm] = useState({
    id_rol: "",
    nombre_completo: "",
    correo: "",
    telefono: "",
    contrasena: "",
    confirmar: "",
  });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [messageDialog, setMessageDialog] = useState<{
    title: string;
    message: string;
    onClose?: () => void;
  } | null>(null);

  const closeMessageDialog = () => {
    const onClose = messageDialog?.onClose;
    setMessageDialog(null);
    onClose?.();
  };

  // Carga roles disponibles para asignar permisos al usuario.
  useEffect(() => {
    cargarRoles();
  }, []);

  // Consulta roles desde el backend para el selector.
  const cargarRoles = async () => {
    try {
      setRoles(await usuariosService.getRoles());
    } catch (e: any) {
      setMessageDialog({ title: "Error", message: e.message });
    }
  };

  const set = (key: string) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  // Valida nombre, correo, rol y contrasena antes de crear.
  const validar = () => {
    const e: Record<string, string> = {};

    if (!form.id_rol) e.id_rol = "Seleccione un rol";

    if (!form.nombre_completo.trim()) e.nombre_completo = "Campo requerido";

    if (!form.correo.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo))
      e.correo = "Correo inválido";

    if (!form.contrasena || form.contrasena.length < 6) {
      e.contrasena = "Mínimo 6 caracteres";
    } else if (!/[A-Z]/.test(form.contrasena)) {
      e.contrasena = "Debe tener al menos una mayúscula";
    } else if (!/[0-9]/.test(form.contrasena)) {
      e.contrasena = "Debe tener al menos un número";
    }

    if (form.contrasena !== form.confirmar)
      e.confirmar = "Las contraseñas no coinciden";

    setErrores(e);
    return Object.keys(e).length === 0;
  };

  // Guarda el usuario nuevo en la base de datos.
  const guardar = async () => {
    if (!validar()) return;
    try {
      setGuardando(true);
      await usuariosService.crear({
        id_rol: Number(form.id_rol),
        nombre_completo: form.nombre_completo,
        correo: form.correo,
        telefono: form.telefono || null,
        contrasena: form.contrasena,
      });
      setMessageDialog({
        title: "Listo",
        message: "Usuario creado correctamente",
        onClose: () => router.back(),
      });
    } catch (e: any) {
      setMessageDialog({ title: "Error", message: e.message });
    } finally {
      setGuardando(false);
    }
  };

  const inputProps = (key: string) => ({
    value: form[key as keyof typeof form],
    onChangeText: set(key),
    errorMessage: errores[key],
    inputStyle: styles.inputText,
    inputContainerStyle: errores[key]
      ? styles.inputContainerError
      : styles.inputContainer,
    containerStyle: styles.inputWrapper,
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.menuIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>RETRO GARAGE</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Nuevo usuario</Text>
            <Text style={styles.subtitle}>
              Completa los datos para registrar
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Rol */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ROL</Text>
            <Text style={styles.fieldLabel}>
              ROL <Text style={styles.req}>*</Text>
            </Text>

            {roles.length === 0 ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <View style={styles.rolesRow}>
                {roles.map((r) => (
                  <TouchableOpacity
                    key={r.id_rol}
                    style={[
                      styles.rolBtn,
                      form.id_rol === String(r.id_rol) && styles.rolBtnActive,
                    ]}
                    onPress={() => set("id_rol")(String(r.id_rol))}
                  >
                    <Text
                      style={[
                        styles.rolBtnText,
                        form.id_rol === String(r.id_rol) &&
                          styles.rolBtnTextActive,
                      ]}
                    >
                      {r.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {errores.id_rol ? (
              <Text style={styles.errorText}>{errores.id_rol}</Text>
            ) : null}
          </View>

          <View style={styles.divider} />

          {/* Información */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>INFORMACIÓN</Text>

            <Text style={styles.fieldLabel}>
              NOMBRE COMPLETO <Text style={styles.req}>*</Text>
            </Text>
            <Input
              placeholder="Ej. Juan Pérez"
              {...inputProps("nombre_completo")}
            />

            <Text style={styles.fieldLabel}>
              CORREO <Text style={styles.req}>*</Text>
            </Text>
            <Input
              placeholder="usuario@correo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              {...inputProps("correo")}
            />

            <Text style={styles.fieldLabel}>TELÉFONO</Text>
            <Input
              placeholder="Ej. 8888-8888"
              keyboardType="phone-pad"
              {...inputProps("telefono")}
            />
          </View>

          <View style={styles.divider} />

          {/* Contraseña */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CONTRASEÑA</Text>

            <Text style={styles.fieldLabel}>
              CONTRASEÑA <Text style={styles.req}>*</Text>
            </Text>
            <Input
              placeholder="Mínimo 6 caracteres"
              secureTextEntry
              {...inputProps("contrasena")}
            />

            <Text style={styles.fieldLabel}>
              CONFIRMAR CONTRASEÑA <Text style={styles.req}>*</Text>
            </Text>
            <Input
              placeholder="Repetí la contraseña"
              secureTextEntry
              {...inputProps("confirmar")}
            />
          </View>

          {/* Botones */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[
                styles.fabBtn,
                styles.fabGuardar,
                guardando && styles.fabDisabled,
              ]}
              onPress={guardar}
              disabled={guardando}
            >
              {guardando ? (
                <ActivityIndicator color="white" />
              ) : (
                <MaterialIcons name="check" size={28} color="white" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.fabBtn, styles.fabCancelar]}
              onPress={() => router.back()}
            >
              <MaterialIcons name="close" size={28} color="white" />
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>© 2026 RETRO GARAGE</Text>
        </ScrollView>

        <MessageDialog
          visible={messageDialog !== null}
          title={messageDialog?.title ?? ""}
          message={messageDialog?.message ?? ""}
          onClose={closeMessageDialog}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

// Estilos visuales del formulario de nuevo usuario.
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  header: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: sp(16),
    paddingVertical: sp(14),
    paddingTop: sp(48),
  },
  menuBtn: { width: sp(40) },
  menuIcon: { color: Colors.white, fontSize: fs(20) },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: fs(14),
    fontWeight: "600",
    letterSpacing: 2,
  },
  scroll: { flex: 1, paddingHorizontal: sp(20) },
  titleSection: { paddingVertical: sp(20) },
  title: { fontSize: fs(22), fontWeight: "600", color: Colors.primary },
  subtitle: { fontSize: fs(13), color: Colors.gray, marginTop: sp(4) },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: sp(8) },
  section: { paddingVertical: sp(16) },
  sectionLabel: {
    fontSize: fs(11),
    fontWeight: "600",
    color: Colors.gray,
    letterSpacing: 1.5,
    marginBottom: sp(12),
  },
  fieldLabel: {
    fontSize: fs(11),
    fontWeight: "600",
    color: Colors.primary,
    letterSpacing: 1,
    marginBottom: sp(2),
    marginLeft: sp(10),
  },
  req: { color: "#993C1D" },
  rolesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: sp(8),
    marginBottom: sp(8),
  },
  rolBtn: {
    paddingHorizontal: sp(14),
    paddingVertical: sp(8),
    borderRadius: sp(6),
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  rolBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  rolBtnText: { fontSize: fs(13), color: Colors.primary, fontWeight: "500" },
  rolBtnTextActive: { color: Colors.cream },
  errorText: {
    fontSize: fs(12),
    color: "#993C1D",
    marginLeft: sp(10),
    marginTop: sp(4),
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: sp(6),
    paddingHorizontal: sp(10),
    backgroundColor: Colors.white,
  },
  inputContainerError: {
    borderWidth: 1,
    borderColor: "#993C1D",
    borderRadius: sp(6),
    paddingHorizontal: sp(10),
    backgroundColor: Colors.white,
  },
  inputText: { fontSize: fs(14), color: Colors.primary },
  inputWrapper: { paddingHorizontal: 0, marginBottom: sp(8) },
  buttons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: sp(24),
    marginTop: sp(8),
    marginBottom: sp(32),
  },
  fabBtn: {
    width: sp(64),
    height: sp(64),
    borderRadius: sp(32),
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  fabGuardar: { backgroundColor: "#0F6E56" },
  fabCancelar: { backgroundColor: "#C62828" },
  fabDisabled: { backgroundColor: "#888" },
  footer: {
    textAlign: "center",
    fontSize: fs(11),
    color: Colors.gray,
    marginBottom: sp(32),
  },
});
