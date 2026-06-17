import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Input, Text } from "@rneui/themed";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { clientesService } from "../../services/clientesService";

export default function EditarClienteScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    identificacion: "",
    fecha_nacimiento: "",
    correo: "",
    telefono: "",
    provincia: "",
    canton: "",
    notas: "",
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

  useEffect(() => {
    cargarCliente();
  }, [id]);

  const cargarCliente = async () => {
    try {
      setCargando(true);
      const data = await clientesService.getById(Number(id));
      setForm({
        nombre: data.nombre ?? "",
        apellido: data.apellido ?? "",
        identificacion: data.identificacion ?? "",
        fecha_nacimiento: data.fecha_nacimiento
          ? data.fecha_nacimiento.split("T")[0]
          : "",
        correo: data.correo ?? "",
        telefono: data.telefono ?? "",
        provincia: data.provincia ?? "",
        canton: data.canton ?? "",
        notas: data.notas ?? "",
      });
    } catch (e: any) {
      setMessageDialog({
        title: "Error",
        message: e.message,
        onClose: () => router.back(),
      });
    } finally {
      setCargando(false);
    }
  };

  const set = (key: string) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const validar = () => {
    const e: Record<string, string> = {};

    if (!form.nombre.trim()) e.nombre = "Campo requerido";
    if (!form.apellido.trim()) e.apellido = "Campo requerido";

    // Identificación: solo validar formato, no se puede cambiar
    if (!form.identificacion.trim() || form.identificacion.length < 9)
      e.identificacion = "Identificación inválida o campo requerido";

    // Teléfono: solo dígitos y longitud mínima
    const telefonoLimpio = form.telefono.replace(/\D/g, "");
    if (!form.telefono.trim() || telefonoLimpio.length < 8)
      e.telefono = "Teléfono inválido o campo requerido";

    // Correo: formato válido
    if (form.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo))
      e.correo = "Correo electrónico inválido";

    // Fecha de nacimiento: formato, no futura, edad razonable
    if (form.fecha_nacimiento) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(form.fecha_nacimiento)) {
        e.fecha_nacimiento = "Formato inválido (YYYY-MM-DD)";
      } else {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const nacimiento = new Date(form.fecha_nacimiento + "T00:00:00");
        const edadAnios =
          (hoy.getTime() - nacimiento.getTime()) /
          (1000 * 60 * 60 * 24 * 365.25);

        if (nacimiento >= hoy) {
          e.fecha_nacimiento = "La fecha no puede ser hoy ni en el futuro";
        } else if (edadAnios < 1) {
          e.fecha_nacimiento = "La fecha no parece válida";
        } else if (edadAnios > 120) {
          e.fecha_nacimiento = "La fecha no parece válida";
        }
      }
    }

    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const guardar = async () => {
    if (!validar()) return;
    try {
      setGuardando(true);
      await clientesService.editar(Number(id), {
        nombre: form.nombre,
        apellido: form.apellido,
        identificacion: form.identificacion,
        fecha_nacimiento: form.fecha_nacimiento || null,
        correo: form.correo || null,
        telefono: form.telefono,
        provincia: form.provincia || null,
        canton: form.canton || null,
        notas: form.notas || null,
      });
      setMessageDialog({
        title: "Listo",
        message: "Cliente actualizado correctamente",
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

  if (cargando)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );

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
            <Text style={styles.title}>Editar cliente</Text>
            <Text style={styles.subtitle}>Modificá los datos del cliente</Text>
          </View>

          <View style={styles.divider} />

          {/* Información personal */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>INFORMACIÓN PERSONAL</Text>

            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>
                  NOMBRE <Text style={styles.req}>*</Text>
                </Text>
                <Input placeholder="Ej. Carlos" {...inputProps("nombre")} />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>
                  APELLIDO <Text style={styles.req}>*</Text>
                </Text>
                <Input placeholder="Ej. Méndez" {...inputProps("apellido")} />
              </View>
            </View>

            {/* Identificación bloqueada */}
            <Text style={styles.fieldLabel}>
              IDENTIFICACIÓN <Text style={styles.req}>*</Text>
            </Text>
            <Input
              placeholder="Ej. 1-1234-5678"
              {...inputProps("identificacion")}
              disabled={true}
              inputContainerStyle={[
                styles.inputContainer,
                styles.inputDisabled,
              ]}
            />

            <Text style={styles.fieldLabel}>FECHA DE NACIMIENTO</Text>
            <Input
              placeholder="YYYY-MM-DD"
              {...inputProps("fecha_nacimiento")}
            />
          </View>

          <View style={styles.divider} />

          {/* Contacto */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CONTACTO</Text>

            <Text style={styles.fieldLabel}>CORREO ELECTRÓNICO</Text>
            <Input
              placeholder="cliente@correo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              {...inputProps("correo")}
            />

            <Text style={styles.fieldLabel}>
              TELÉFONO <Text style={styles.req}>*</Text>
            </Text>
            <Input
              placeholder="Ej. 8888-8888"
              keyboardType="phone-pad"
              {...inputProps("telefono")}
            />
          </View>

          <View style={styles.divider} />

          {/* Dirección */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DIRECCIÓN</Text>

            <Text style={styles.fieldLabel}>PROVINCIA</Text>
            <Input placeholder="Ej. San José" {...inputProps("provincia")} />

            <Text style={styles.fieldLabel}>CANTÓN / CIUDAD</Text>
            <Input placeholder="Ej. Escazú" {...inputProps("canton")} />
          </View>

          <View style={styles.divider} />

          {/* Notas */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>NOTAS</Text>

            <Text style={styles.fieldLabel}>OBSERVACIONES</Text>

            <Input
              placeholder="Ej. Cliente frecuente, prefiere llamadas..."
              multiline
              numberOfLines={3}
              {...inputProps("notas")}
              inputContainerStyle={[
                errores["notas"]
                  ? styles.inputContainerError
                  : styles.inputContainer,
                { height: 80, alignItems: "flex-start" },
              ]}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
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
  menuIcon: { color: Colors.cream, fontSize: fs(20) },
  headerTitle: {
    color: Colors.cream,
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
  row: { flexDirection: "row", gap: sp(12) },
  halfField: { flex: 1 },
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
  // 👇 Nuevo estilo para campo deshabilitado
  inputDisabled: {
    backgroundColor: Colors.border,
    opacity: 0.6,
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
