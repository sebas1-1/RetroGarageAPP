import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Dialog, Input, Text } from "@rneui/themed";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../../constants/colors";
import { fs, sp } from "../../constants/responsive";
import { Categoria, categoriasService } from "../../services/categoriasService";

// Tipos permitidos para clasificar una categoria.
const TIPOS = ["Producto", "Servicio"] as const;

// Pantalla para administrar categorias de productos y servicios.
export default function CategoriasScreen() {
  const router = useRouter();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState<number | null>(null);
  const [categoriaAEliminar, setCategoriaAEliminar] =
    useState<Categoria | null>(null);
  const [dialogError, setDialogError] = useState("");
  const [form, setForm] = useState({ nombre: "", tipo: "", descripcion: "" });
  const [errores, setErrores] = useState<Record<string, string>>({});

  // Recarga categorias cada vez que el usuario vuelve a esta pantalla.
  useFocusEffect(
    useCallback(() => {
      cargar();
    }, []),
  );

  // Trae las categorias desde el backend y maneja el estado de carga.
  const cargar = async () => {
    try {
      setCargando(true);
      setCategorias(await categoriasService.getAll());
    } catch (e: any) {
      setDialogError(e.message);
    } finally {
      setCargando(false);
    }
  };

  const set = (key: string) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  // Valida que el formulario tenga los datos minimos para guardar.
  const validar = () => {
    const e: Record<string, string> = {};
    if (!form.nombre.trim()) e.nombre = "Campo requerido";
    if (!form.tipo) e.tipo = "Seleccione un tipo";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  // Crea o actualiza una categoria dependiendo de si hay una seleccionada.
  const guardar = async () => {
    if (!validar()) return;
    try {
      setGuardando(true);
      await categoriasService.crear({
        nombre: form.nombre.trim(),
        tipo: form.tipo as "Producto" | "Servicio",
        descripcion: form.descripcion.trim() || null,
      });
      setForm({ nombre: "", tipo: "", descripcion: "" });
      setErrores({});
      await cargar();
    } catch (e: any) {
      setDialogError(e.message);
    } finally {
      setGuardando(false);
    }
  };

  // Guarda temporalmente la categoria que el usuario quiere borrar.
  const confirmarEliminar = (cat: Categoria) => setCategoriaAEliminar(cat);

  // Elimina la categoria confirmada y vuelve a cargar la lista.
  const eliminar = async (id: number) => {
    try {
      setEliminando(id);
      const res = await categoriasService.eliminar(id);
      setCategoriaAEliminar(null);
      await cargar();
    } catch (e: any) {
      setDialogError(e.message);
    } finally {
      setEliminando(null);
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
        {/* Header */}
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
            <Text style={styles.title}>Categorías</Text>
            <Text style={styles.subtitle}>
              Organización de productos y servicios
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Formulario */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>NUEVA CATEGORÍA</Text>

            <Text style={styles.fieldLabel}>NOMBRE</Text>
            <Input
              placeholder="Ej. Repuestos de motor"
              {...inputProps("nombre")}
            />

            <Text style={styles.fieldLabel}>TIPO</Text>
            {errores.tipo ? (
              <Text style={styles.errorText}>{errores.tipo}</Text>
            ) : null}
            <View style={styles.tiposRow}>
              {TIPOS.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.tipoBtn,
                    form.tipo === t && styles.tipoBtnActive,
                  ]}
                  onPress={() => set("tipo")(t)}
                >
                  <Text
                    style={[
                      styles.tipoBtnText,
                      form.tipo === t && styles.tipoBtnTextActive,
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: sp(12) }]}>
              DESCRIPCIÓN
            </Text>
            <Input
              placeholder="Describe brevemente esta categoría..."
              multiline
              numberOfLines={3}
              {...inputProps("descripcion")}
              inputContainerStyle={[
                errores.descripcion
                  ? styles.inputContainerError
                  : styles.inputContainer,
                { minHeight: sp(80), alignItems: "flex-start" },
              ]}
              inputStyle={[styles.inputText, { textAlignVertical: "top" }]}
            />

            <TouchableOpacity
              style={[styles.botonCrear, guardando && styles.botonDisabled]}
              onPress={guardar}
              disabled={guardando}
              activeOpacity={0.85}
            >
              {guardando ? (
                <ActivityIndicator color={Colors.cream} />
              ) : (
                <Text style={styles.botonCrearTexto}>CREAR CATEGORÍA</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Lista */}
          <View style={styles.listHeader}>
            <Text style={styles.sectionLabel}>CATEGORÍAS EXISTENTES</Text>
            <Text style={styles.countText}>
              {cargando ? "..." : `${categorias.length} categorías`}
            </Text>
          </View>

          {cargando ? (
            <ActivityIndicator
              color={Colors.primary}
              style={{ marginTop: sp(20) }}
            />
          ) : categorias.length === 0 ? (
            <Text style={styles.vacias}>No hay categorías registradas</Text>
          ) : (
            categorias.map((cat) => (
              <View key={cat.id_categoria} style={styles.catCard}>
                <View style={styles.catIconBox}>
                  <MaterialIcons
                    name={cat.tipo === "Producto" ? "inventory-2" : "build"}
                    size={20}
                    color={Colors.gray}
                  />
                </View>
                <View style={styles.catInfo}>
                  <Text style={styles.catNombre}>{cat.nombre}</Text>
                  <Text style={styles.catTipo}>{cat.tipo}</Text>
                </View>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => confirmarEliminar(cat)}
                  disabled={eliminando === cat.id_categoria}
                >
                  {eliminando === cat.id_categoria ? (
                    <ActivityIndicator size="small" color={Colors.gray} />
                  ) : (
                    <MaterialIcons
                      name="delete-outline"
                      size={20}
                      color={Colors.gray}
                    />
                  )}
                </TouchableOpacity>
              </View>
            ))
          )}

          <Text style={styles.footer}>© 2026 RETRO GARAGE</Text>
        </ScrollView>

        <Dialog
          isVisible={categoriaAEliminar !== null}
          onBackdropPress={() => setCategoriaAEliminar(null)}
        >
          <Dialog.Title title="Eliminar categoría" />
          <Text style={styles.dialogText}>
            ¿Eliminar "{categoriaAEliminar?.nombre}"?
          </Text>
          <Dialog.Actions>
            <Dialog.Button
              title="CANCELAR"
              onPress={() => setCategoriaAEliminar(null)}
            />
            <Dialog.Button
              title={
                eliminando === categoriaAEliminar?.id_categoria
                  ? "ELIMINANDO..."
                  : "ELIMINAR"
              }
              onPress={() =>
                categoriaAEliminar && eliminar(categoriaAEliminar.id_categoria)
              }
              disabled={eliminando !== null}
            />
          </Dialog.Actions>
        </Dialog>

        <Dialog
          isVisible={Boolean(dialogError)}
          onBackdropPress={() => setDialogError("")}
        >
          <Dialog.Title title="Error" />
          <Text style={styles.dialogText}>{dialogError}</Text>
          <Dialog.Actions>
            <Dialog.Button title="OK" onPress={() => setDialogError("")} />
          </Dialog.Actions>
        </Dialog>
      </View>
    </KeyboardAvoidingView>
  );
}

// Estilos visuales de categorias.
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
    marginBottom: sp(4),
    marginLeft: sp(10),
  },
  errorText: {
    fontSize: fs(12),
    color: "#993C1D",
    marginLeft: sp(10),
    marginBottom: sp(6),
  },
  tiposRow: { flexDirection: "row", gap: sp(10), marginBottom: sp(4) },
  tipoBtn: {
    flex: 1,
    paddingVertical: sp(12),
    borderRadius: sp(8),
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: "center",
  },
  tipoBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tipoBtnText: { fontSize: fs(13), color: Colors.primary, fontWeight: "500" },
  tipoBtnTextActive: { color: Colors.cream },
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
  inputWrapper: { paddingHorizontal: 0, marginBottom: sp(4) },
  botonCrear: {
    backgroundColor: Colors.primary,
    borderRadius: sp(8),
    paddingVertical: sp(16),
    alignItems: "center",
    marginTop: sp(16),
  },
  botonDisabled: { backgroundColor: Colors.gray },
  botonCrearTexto: {
    color: Colors.cream,
    fontSize: fs(13),
    fontWeight: "700",
    letterSpacing: 3,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: sp(16),
    marginBottom: sp(12),
  },
  countText: { fontSize: fs(12), color: Colors.gray },
  vacias: {
    textAlign: "center",
    color: Colors.gray,
    fontSize: fs(13),
    marginVertical: sp(20),
  },
  catCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: sp(10),
    padding: sp(14),
    marginBottom: sp(8),
    borderWidth: 1,
    borderColor: Colors.border,
    gap: sp(12),
  },
  catIconBox: {
    width: sp(40),
    height: sp(40),
    borderRadius: sp(8),
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  catInfo: { flex: 1 },
  catNombre: {
    fontSize: fs(14),
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: sp(2),
  },
  catTipo: { fontSize: fs(12), color: Colors.gray },
  actionBtn: {
    width: sp(36),
    height: sp(36),
    borderRadius: sp(8),
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  dialogText: { marginBottom: sp(20), color: Colors.primary },
  footer: {
    textAlign: "center",
    fontSize: fs(11),
    color: Colors.gray,
    marginTop: sp(24),
    marginBottom: sp(32),
  },
});
