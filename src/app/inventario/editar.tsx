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
import { Categoria, categoriasService } from "../../services/categoriasService";
import {
    ProductoInput,
    inventarioService
} from "../../services/inventarioService";

// Unidades que puede manejar un producto de inventario.
const UNIDADES = ["Unidades", "Litros", "Metros"];

// Pantalla para editar un producto ya registrado en inventario.
export default function EditarProductoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [form, setForm] = useState({
    nombre: "",
    codigo_item: "",
    id_categoria: "",
    stock_actual: "",
    stock_minimo: "",
    unidad_medida: "Unidades",
    precio_venta: "",
    precio_costo: "",
    proveedor: "",
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

  // Carga producto y categorias cuando se recibe el id por la ruta.
  useEffect(() => {
    cargarDatos();
  }, []);

  // Consulta la informacion necesaria para llenar el formulario.
  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [producto, cats] = await Promise.all([
        inventarioService.getById(Number(id)),
        categoriasService.getAll(),
      ]);
      setCategorias(
        (cats as Categoria[]).filter((c) => c.tipo === "Producto" && c.activo),
      );
      setForm({
        nombre: producto.nombre,
        codigo_item: producto.codigo_item,
        id_categoria: String(producto.id_categoria),
        stock_actual: String(producto.stock_actual),
        stock_minimo: String(producto.stock_minimo),
        unidad_medida: producto.unidad_medida,
        precio_venta: String(producto.precio_venta),
        precio_costo: String(producto.precio_costo),
        proveedor: producto.proveedor ?? "",
      });
    } catch (e: any) {
      setMessageDialog({ title: "Error", message: e.message });
    } finally {
      setCargando(false);
    }
  };

  const set = (key: string) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  // Valida que precios, stock y categoria tengan valores correctos.
  const validar = () => {
    const e: Record<string, string> = {};
    if (!form.nombre.trim()) e.nombre = "Campo requerido";
    if (!form.codigo_item.trim()) e.codigo_item = "Campo requerido";
    if (!form.id_categoria) e.id_categoria = "Seleccione una categoría";
    if (!form.stock_actual || isNaN(Number(form.stock_actual)))
      e.stock_actual = "Ingrese un número válido";
    if (!form.stock_minimo || isNaN(Number(form.stock_minimo)))
      e.stock_minimo = "Ingrese un número válido";
    if (!form.precio_venta || isNaN(Number(form.precio_venta)))
      e.precio_venta = "Ingrese un número válido";
    if (!form.precio_costo || isNaN(Number(form.precio_costo)))
      e.precio_costo = "Ingrese un número válido";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  // Envia los cambios del producto al backend.
  const guardar = async () => {
    if (!validar()) return;
    try {
      setGuardando(true);
      const payload: ProductoInput = {
        id_categoria: Number(form.id_categoria),
        nombre: form.nombre,
        codigo_item: form.codigo_item,
        precio_venta: Number(form.precio_venta),
        precio_costo: Number(form.precio_costo),
        stock_actual: Number(form.stock_actual),
        stock_minimo: Number(form.stock_minimo),
        unidad_medida: form.unidad_medida,
        proveedor: form.proveedor.trim() || null,
      };
      await inventarioService.editar(Number(id), payload);
      setMessageDialog({
        title: "Listo",
        message: "Producto actualizado correctamente",
        onClose: () => router.back(),
      });
    } catch (e: any) {
      setMessageDialog({ title: "Error", message: e.message });
    } finally {
      setGuardando(false);
    }
  };

  const marcarAgotado = () => {
    setMessageDialog({
      title: "¿Marcar como agotado?",
      message: "El stock se pondrá en 0. ¿Deseás continuar?",
      onClose: async () => {
        try {
          await inventarioService.marcarAgotado(Number(id));
          router.back();
        } catch (e: any) {
          setMessageDialog({ title: "Error", message: e.message });
        }
      },
    });
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

  const estadoColor = () => {
    const actual = Number(form.stock_actual);
    const minimo = Number(form.stock_minimo);
    if (!form.stock_actual) return Colors.gray;
    if (actual <= 0) return "#C62828";
    if (actual <= minimo) return "#E65100";
    return "#2E7D32";
  };

  const estadoLabel = () => {
    const actual = Number(form.stock_actual);
    const minimo = Number(form.stock_minimo);
    if (!form.stock_actual) return "—";
    if (actual <= 0) return "AGOTADO";
    if (actual <= minimo) return "STOCK BAJO";
    return "NORMAL";
  };

  if (cargando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

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
            <Text style={styles.title}>Editar ítem</Text>
            <Text style={styles.subtitle}>
              Modifica la información del producto
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Información del producto */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>INFORMACIÓN DEL PRODUCTO</Text>

            <Text style={styles.fieldLabel}>
              NOMBRE DEL PRODUCTO <Text style={styles.req}>*</Text>
            </Text>
            <Input
              placeholder="Ej: Filtro de aceite"
              {...inputProps("nombre")}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>
                  CÓDIGO INTERNO <Text style={styles.req}>*</Text>
                </Text>
                <Input
                  placeholder="Ej: REP-001"
                  {...inputProps("codigo_item")}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>
                  CATEGORÍA <Text style={styles.req}>*</Text>
                </Text>
                <View style={styles.selectWrapper}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {categorias.map((c) => (
                      <TouchableOpacity
                        key={c.id_categoria}
                        style={[
                          styles.selectChip,
                          form.id_categoria === String(c.id_categoria) &&
                            styles.selectChipActive,
                        ]}
                        onPress={() =>
                          set("id_categoria")(String(c.id_categoria))
                        }
                      >
                        <Text
                          style={[
                            styles.selectChipText,
                            form.id_categoria === String(c.id_categoria) &&
                              styles.selectChipTextActive,
                          ]}
                        >
                          {c.nombre}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  {errores.id_categoria ? (
                    <Text style={styles.errorText}>{errores.id_categoria}</Text>
                  ) : null}
                </View>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Control de inventario */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CONTROL DE INVENTARIO</Text>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>
                  CANTIDAD DISPONIBLE <Text style={styles.req}>*</Text>
                </Text>
                <Input
                  placeholder="Ej: 24"
                  keyboardType="numeric"
                  {...inputProps("stock_actual")}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>
                  CANTIDAD MÍNIMA <Text style={styles.req}>*</Text>
                </Text>
                <Input
                  placeholder="Ej: 5"
                  keyboardType="numeric"
                  {...inputProps("stock_minimo")}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>
              UNIDAD DE MEDIDA <Text style={styles.req}>*</Text>
            </Text>
            <View style={styles.rolesRow}>
              {UNIDADES.map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[
                    styles.rolBtn,
                    form.unidad_medida === u && styles.rolBtnActive,
                  ]}
                  onPress={() => set("unidad_medida")(u)}
                >
                  <Text
                    style={[
                      styles.rolBtnText,
                      form.unidad_medida === u && styles.rolBtnTextActive,
                    ]}
                  >
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Estado calculado */}
            <View style={styles.estadoCard}>
              <View style={styles.estadoLeft}>
                <View
                  style={[styles.dot, { backgroundColor: estadoColor() }]}
                />
                <Text style={styles.estadoTitle}>Estado actual</Text>
              </View>
              <View
                style={[styles.estadoBadge, { borderColor: estadoColor() }]}
              >
                <Text
                  style={[styles.estadoBadgeText, { color: estadoColor() }]}
                >
                  {estadoLabel()}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Precios */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PRECIOS</Text>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>
                  PRECIO VENTA <Text style={styles.req}>*</Text>
                </Text>
                <Input
                  placeholder="Ej: 5000"
                  keyboardType="numeric"
                  {...inputProps("precio_venta")}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>
                  PRECIO COSTO <Text style={styles.req}>*</Text>
                </Text>
                <Input
                  placeholder="Ej: 3000"
                  keyboardType="numeric"
                  {...inputProps("precio_costo")}
                />
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Proveedor */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PROVEEDOR</Text>
            <Text style={styles.fieldLabel}>PROVEEDOR</Text>
            <Input
              placeholder="Ej: AutoParts CR"
              {...inputProps("proveedor")}
            />
          </View>

          {/* Botones FAB */}
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

          {/* Marcar agotado */}
          <TouchableOpacity style={styles.agotadoBtn} onPress={marcarAgotado}>
            <MaterialIcons name="delete-outline" size={18} color="#C62828" />
            <Text style={styles.agotadoBtnText}>Marcar como agotado</Text>
          </TouchableOpacity>

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

// Estilos visuales del formulario de editar producto.
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.cream,
  },
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
  row: { flexDirection: "row", gap: sp(8) },
  selectWrapper: { marginBottom: sp(8), marginLeft: sp(10) },
  selectChip: {
    paddingHorizontal: sp(12),
    paddingVertical: sp(7),
    borderRadius: sp(6),
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    marginRight: sp(6),
  },
  selectChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  selectChipText: {
    fontSize: fs(12),
    color: Colors.primary,
    fontWeight: "500",
  },
  selectChipTextActive: { color: Colors.cream },
  rolesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: sp(8),
    marginBottom: sp(12),
    marginLeft: sp(10),
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
  estadoCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: sp(8),
    padding: sp(12),
    marginTop: sp(4),
    backgroundColor: Colors.white,
  },
  estadoLeft: { flexDirection: "row", alignItems: "center", gap: sp(10) },
  dot: { width: sp(10), height: sp(10), borderRadius: sp(5) },
  estadoTitle: { fontSize: fs(13), fontWeight: "600", color: Colors.primary },
  estadoBadge: {
    paddingHorizontal: sp(10),
    paddingVertical: sp(4),
    borderRadius: sp(4),
    borderWidth: 1,
  },
  estadoBadgeText: { fontSize: fs(11), fontWeight: "600", letterSpacing: 0.5 },
  errorText: { fontSize: fs(12), color: "#993C1D", marginTop: sp(4) },
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
    marginBottom: sp(16),
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
  agotadoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: sp(6),
    borderWidth: 1,
    borderColor: "#C62828",
    borderRadius: sp(8),
    paddingVertical: sp(12),
    marginHorizontal: sp(20),
    marginBottom: sp(16),
    backgroundColor: Colors.white,
  },
  agotadoBtnText: {
    fontSize: fs(13),
    color: "#C62828",
    fontWeight: "600",
  },
  footer: {
    textAlign: "center",
    fontSize: fs(11),
    color: Colors.gray,
    marginBottom: sp(32),
  },
});
