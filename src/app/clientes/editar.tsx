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
import { DatePickerField } from "../../components/shared/DatePickerField";
import { MessageDialog } from "../../components/shared/MessageDialog";
import { Colors } from "../../constants/colors";
import { fs, sp } from "../../constants/responsive";
import { Auto, AutoInput, autosService } from "../../services/autosService";
import { clientesService } from "../../services/clientesService";

type AutoForm = {
  marca: string;
  modelo: string;
  anio: string;
  placa: string;
};

const nuevoAuto = (): AutoForm => ({
  marca: "",
  modelo: "",
  anio: "",
  placa: "",
});

// Pantalla para modificar los datos de un cliente existente.
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
  const [autos, setAutos] = useState<AutoForm[]>([]);
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

  const yesterday = new Date();
  yesterday.setHours(0, 0, 0, 0);
  yesterday.setDate(yesterday.getDate() - 1);

  // Carga el cliente cuando llega el id por la ruta.
  useEffect(() => {
    cargarCliente();
  }, [id]);

  // Obtiene el cliente desde la API y llena el formulario.
  const cargarCliente = async () => {
    try {
      setCargando(true);
      const data = await clientesService.getById(Number(id));
      const identificacion = data.identificacion ?? "";
      setForm({
        nombre: data.nombre ?? "",
        apellido: data.apellido ?? "",
        identificacion,
        fecha_nacimiento: data.fecha_nacimiento
          ? data.fecha_nacimiento.split("T")[0]
          : "",
        correo: data.correo ?? "",
        telefono: data.telefono ?? "",
        provincia: data.provincia ?? "",
        canton: data.canton ?? "",
        notas: data.notas ?? "",
      });

      try {
        const autosData: Auto[] = await autosService.getByIdentificacion(
          identificacion,
        );
        setAutos(
          autosData.map((auto) => ({
            marca: auto.marca ?? "",
            modelo: auto.modelo ?? "",
            anio: auto.anio ?? "",
            placa: auto.placa ?? "",
          })),
        );
      } catch {
        setAutos([]);
      }
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

  const setAuto = (index: number, key: keyof AutoForm) => (val: string) =>
    setAutos((actuales) =>
      actuales.map((auto, i) =>
        i === index ? { ...auto, [key]: val } : auto,
      ),
    );

  const agregarAuto = () => setAutos((actuales) => [...actuales, nuevoAuto()]);

  const quitarAuto = (index: number) =>
    setAutos((actuales) => actuales.filter((_, i) => i !== index));

  const autosParaGuardar = (): AutoInput[] =>
    autos
      .map((auto) => ({
        identificacion: form.identificacion.trim(),
        marca: auto.marca.trim() || null,
        modelo: auto.modelo.trim() || null,
        anio: auto.anio.trim() || null,
        placa: auto.placa.trim() || null,
      }))
      .filter((auto) => auto.marca || auto.modelo || auto.anio || auto.placa);

  // Revisa que los campos importantes tengan datos validos.
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

    autos.forEach((auto, index) => {
      const tieneDatos =
        auto.marca.trim() ||
        auto.modelo.trim() ||
        auto.anio.trim() ||
        auto.placa.trim();

      if (!tieneDatos) {
        e[`auto_${index}`] = "Completá el auto o eliminá esta fila";
      }
    });

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

  // Guarda los cambios del cliente en el backend.
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

      await autosService.reemplazarPorIdentificacion(
        form.identificacion,
        autosParaGuardar(),
      );

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
            <DatePickerField
              value={form.fecha_nacimiento}
              onChange={set("fecha_nacimiento")}
              errorMessage={errores.fecha_nacimiento}
              maximumDate={yesterday}
              allowClear
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

          {/* Autos */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>AUTOS</Text>
              <TouchableOpacity style={styles.addBtn} onPress={agregarAuto}>
                <MaterialIcons name="add" size={18} color={Colors.cream} />
                <Text style={styles.addBtnText}>Agregar auto</Text>
              </TouchableOpacity>
            </View>

            {autos.length === 0 ? (
              <Text style={styles.emptyText}>Sin autos agregados</Text>
            ) : null}

            {autos.map((auto, index) => (
              <View key={index} style={styles.autoBox}>
                <View style={styles.autoHeader}>
                  <Text style={styles.autoTitle}>Auto {index + 1}</Text>
                  <TouchableOpacity onPress={() => quitarAuto(index)}>
                    <MaterialIcons name="delete-outline" size={22} color="#993C1D" />
                  </TouchableOpacity>
                </View>

                {errores[`auto_${index}`] ? (
                  <Text style={styles.errorText}>{errores[`auto_${index}`]}</Text>
                ) : null}

                <View style={styles.row}>
                  <View style={styles.halfField}>
                    <Text style={styles.fieldLabel}>MARCA</Text>
                    <Input
                      placeholder="Ej. Toyota"
                      value={auto.marca}
                      onChangeText={setAuto(index, "marca")}
                      inputStyle={styles.inputText}
                      inputContainerStyle={styles.inputContainer}
                      containerStyle={styles.inputWrapper}
                    />
                  </View>
                  <View style={styles.halfField}>
                    <Text style={styles.fieldLabel}>MODELO</Text>
                    <Input
                      placeholder="Ej. Corolla"
                      value={auto.modelo}
                      onChangeText={setAuto(index, "modelo")}
                      inputStyle={styles.inputText}
                      inputContainerStyle={styles.inputContainer}
                      containerStyle={styles.inputWrapper}
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.halfField}>
                    <Text style={styles.fieldLabel}>AÑO</Text>
                    <Input
                      placeholder="Ej. 1985"
                      value={auto.anio}
                      onChangeText={setAuto(index, "anio")}
                      keyboardType="numeric"
                      inputStyle={styles.inputText}
                      inputContainerStyle={styles.inputContainer}
                      containerStyle={styles.inputWrapper}
                    />
                  </View>
                  <View style={styles.halfField}>
                    <Text style={styles.fieldLabel}>PLACA</Text>
                    <Input
                      placeholder="Ej. ABC123"
                      value={auto.placa}
                      onChangeText={setAuto(index, "placa")}
                      autoCapitalize="characters"
                      inputStyle={styles.inputText}
                      inputContainerStyle={styles.inputContainer}
                      containerStyle={styles.inputWrapper}
                    />
                  </View>
                </View>
              </View>
            ))}
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

// Estilos visuales del formulario de editar cliente.
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: sp(12),
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
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: sp(4),
    backgroundColor: Colors.primary,
    borderRadius: sp(6),
    paddingHorizontal: sp(10),
    paddingVertical: sp(8),
  },
  addBtnText: {
    color: Colors.cream,
    fontSize: fs(12),
    fontWeight: "600",
  },
  emptyText: {
    color: Colors.gray,
    fontSize: fs(13),
    marginLeft: sp(10),
    marginBottom: sp(8),
  },
  autoBox: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: sp(8),
    backgroundColor: Colors.white,
    padding: sp(12),
    marginBottom: sp(12),
  },
  autoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: sp(8),
  },
  autoTitle: {
    color: Colors.primary,
    fontSize: fs(13),
    fontWeight: "600",
  },
  errorText: {
    fontSize: fs(12),
    color: "#993C1D",
    marginLeft: sp(10),
    marginBottom: sp(8),
  },
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
