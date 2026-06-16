import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Input, Text } from "@rneui/themed";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { Colors } from "../../constants/colors";
import { fs, sp } from "../../constants/responsive";
import { Categoria, serviciosService } from "../../services/serviciosService";

export default function NuevoServicioScreen() {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState({
    id_categoria: "",
    nombre: "",
    precio_base: "",
  });
  const [errores, setErrores] = useState<Record<string, string>>({});

  useEffect(() => {
    cargarCategorias();
  }, []);

  const cargarCategorias = async () => {
    try {
      setCargando(true);
      setCategorias(await serviciosService.getCategorias());
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setCargando(false);
    }
  };

  const set = (key: string) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const validar = () => {
    const e: Record<string, string> = {};
    if (!form.id_categoria) e.id_categoria = "Seleccione una categoría";
    if (!form.nombre.trim()) e.nombre = "Campo requerido";
    if (!form.precio_base || isNaN(Number(form.precio_base)))
      e.precio_base = "Precio inválido";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const guardar = async () => {
    if (!validar()) return;
    try {
      setGuardando(true);
      await serviciosService.crear({
        id_categoria: Number(form.id_categoria),
        nombre: form.nombre,
        precio_base: Number(form.precio_base),
      });
      Alert.alert("Listo", "Servicio creado correctamente", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.message);
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
          <View style={{ width: sp(40) }} />
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Nuevo servicio</Text>
            <Text style={styles.subtitle}>Registrá un nuevo servicio</Text>
          </View>

          <View style={styles.divider} />

          {/* Categoría */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CATEGORÍA</Text>
            {errores.id_categoria ? (
              <Text style={styles.errorText}>{errores.id_categoria}</Text>
            ) : null}
            <View style={styles.categoriasGrid}>
              {categorias.map((c) => (
                <TouchableOpacity
                  key={c.id_categoria}
                  style={[
                    styles.categoriaBtn,
                    form.id_categoria === String(c.id_categoria) &&
                      styles.categoriaBtnActive,
                  ]}
                  onPress={() => set("id_categoria")(String(c.id_categoria))}
                >
                  <Text
                    style={[
                      styles.categoriaBtnText,
                      form.id_categoria === String(c.id_categoria) &&
                        styles.categoriaBtnTextActive,
                    ]}
                  >
                    {c.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Información */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>INFORMACIÓN</Text>

            <Text style={styles.fieldLabel}>
              NOMBRE <Text style={styles.req}>*</Text>
            </Text>
            <Input
              placeholder="Ej. Cambio de aceite"
              {...inputProps("nombre")}
            />

            <Text style={styles.fieldLabel}>
              PRECIO BASE <Text style={styles.req}>*</Text>
            </Text>
            <Input
              placeholder="Ej. 15000"
              keyboardType="numeric"
              {...inputProps("precio_base")}
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
  errorText: {
    fontSize: fs(12),
    color: "#993C1D",
    marginLeft: sp(10),
    marginBottom: sp(8),
  },
  categoriasGrid: { flexDirection: "row", flexWrap: "wrap", gap: sp(8) },
  categoriaBtn: {
    paddingHorizontal: sp(14),
    paddingVertical: sp(8),
    borderRadius: sp(8),
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  categoriaBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoriaBtnText: {
    fontSize: fs(13),
    color: Colors.primary,
    fontWeight: "500",
  },
  categoriaBtnTextActive: { color: Colors.cream },
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
