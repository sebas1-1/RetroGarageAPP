import { useThemedStyles } from "@/contexts/AccessibilityThemeContext";
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
import type { AppColors } from "../../constants/colors";
import { fs, sp } from "../../constants/responsive";
import { Categoria, categoriasService } from "../../services/categoriasService";
import {
  ProductoInput,
  inventarioService,
} from "../../services/inventarioService";
import {
  OfertaRepuesto,
  proveedoresService,
} from "../../services/proveedoresService";

// Unidades que puede manejar un producto de inventario.
const UNIDADES = ["Unidades", "Litros", "Metros"];

type RepuestoEncontrado = {
  mejorOferta: OfertaRepuesto;
  cantidadOfertas: number;
};

const agruparOfertasPorRepuesto = (
  ofertas: OfertaRepuesto[],
): RepuestoEncontrado[] => {
  const agrupadas = new Map<string, RepuestoEncontrado>();

  ofertas.forEach((oferta) => {
    const actual = agrupadas.get(oferta.codigo);

    agrupadas.set(oferta.codigo, {
      mejorOferta:
        !actual || oferta.precio < actual.mejorOferta.precio
          ? oferta
          : actual.mejorOferta,
      cantidadOfertas: (actual?.cantidadOfertas ?? 0) + 1,
    });
  });

  return Array.from(agrupadas.values());
};

// Pantalla para agregar un producto o repuesto al inventario.
export default function NuevoProductoScreen() {
  const { colors: Colors, styles } = useThemedStyles(createStyles);
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [consultandoProveedor, setConsultandoProveedor] = useState(false);
  const [busquedaProveedor, setBusquedaProveedor] = useState("");
  const [ofertasProveedor, setOfertasProveedor] = useState<OfertaRepuesto[]>(
    [],
  );
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

  // Consulta solo las categorias necesarias para el formulario.
  async function cargarCategorias() {
    try {
      const data: Categoria[] = await categoriasService.getAll();
      setCategorias(data.filter((c) => c.tipo === "PRODUCTO" && c.activo));
    } catch (e: any) {
      setMessageDialog({ title: "Error", message: e.message });
    }
  };

  // Carga categorias para que el producto pueda clasificarse.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void cargarCategorias();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, []);

  const set = (key: string) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const repuestosEncontrados = agruparOfertasPorRepuesto(ofertasProveedor);

  const cambiarBusquedaProveedor = (valor: string) => {
    setBusquedaProveedor(valor);
    setOfertasProveedor([]);
    setForm((formActual) => ({
      ...formActual,
      codigo_item: "",
    }));
  };

  // Busca coincidencias externas por nombre, marca o codigo.
  const buscarRepuestoProveedor = async () => {
    const termino = busquedaProveedor.trim();

    if (!termino || consultandoProveedor) return;

    try {
      setConsultandoProveedor(true);
      const ofertas = await proveedoresService.buscar(termino);
      setOfertasProveedor(ofertas);

      if (ofertas.length === 0) {
        setMessageDialog({
          title: "Sin resultados",
          message:
            "No se encontraron repuestos por nombre, código o marca.",
        });
      }
    } catch (error) {
      setOfertasProveedor([]);
      setMessageDialog({
        title: "Error",
        message:
          error instanceof Error
            ? error.message
            : "No fue posible consultar los proveedores",
      });
    } finally {
      setConsultandoProveedor(false);
    }
  };

  // Precarga el producto elegido usando la oferta de menor precio.
  const seleccionarRepuestoProveedor = ({
    mejorOferta,
    cantidadOfertas,
  }: RepuestoEncontrado) => {
    setForm((formActual) => ({
      ...formActual,
      codigo_item: mejorOferta.codigo,
      nombre: mejorOferta.nombre,
      precio_costo: String(mejorOferta.precio),
      proveedor: mejorOferta.proveedor,
    }));
    setBusquedaProveedor(mejorOferta.codigo);
    setOfertasProveedor([]);
    setErrores((erroresActuales) => {
      const nuevosErrores = { ...erroresActuales };
      delete nuevosErrores.codigo_item;
      delete nuevosErrores.nombre;
      delete nuevosErrores.precio_costo;
      return nuevosErrores;
    });

    setMessageDialog({
      title: "Mejor oferta seleccionada",
      message:
        `${mejorOferta.proveedor}\n` +
        `₡${mejorOferta.precio.toLocaleString("es-CR")} · ` +
        `${mejorOferta.existencia} disponibles · ` +
        `entrega en ${mejorOferta.tiempo_entrega_dias} día(s).\n\n` +
        `Se compararon ${cantidadOfertas} oferta(s) para este repuesto.`,
    });
  };

  // Valida nombre, categoria, precios y stock antes de guardar.
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

  // Crea el producto en la base de datos si el formulario es valido.
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
      await inventarioService.crear(payload);
      setMessageDialog({
        title: "Listo",
        message: "Producto agregado correctamente",
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

  const estadoColor = () => {
    const actual = Number(form.stock_actual);
    const minimo = Number(form.stock_minimo);
    if (!form.stock_actual) return Colors.gray;
    if (actual <= 0) return Colors.danger;
    if (actual <= minimo) return Colors.warning;
    return Colors.success;
  };

  const estadoLabel = () => {
    const actual = Number(form.stock_actual);
    const minimo = Number(form.stock_minimo);
    if (!form.stock_actual) return "—";
    if (actual <= 0) return "AGOTADO";
    if (actual <= minimo) return "STOCK BAJO";
    return "NORMAL";
  };

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
            <Text style={styles.title}>Agregar nuevo ítem</Text>
            <Text style={styles.subtitle}>
              Completa la información del producto
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
                  BUSCAR REPUESTO <Text style={styles.req}>*</Text>
                </Text>
                <Input
                  placeholder="Nombre, código o marca"
                  value={busquedaProveedor}
                  onChangeText={cambiarBusquedaProveedor}
                  errorMessage={errores.codigo_item}
                  inputStyle={styles.inputText}
                  inputContainerStyle={
                    errores.codigo_item
                      ? styles.inputContainerError
                      : styles.inputContainer
                  }
                  containerStyle={styles.inputWrapper}
                  onSubmitEditing={buscarRepuestoProveedor}
                  returnKeyType="search"
                  rightIcon={
                    consultandoProveedor ? (
                      <ActivityIndicator
                        size="small"
                        color={Colors.primary}
                      />
                    ) : (
                      <TouchableOpacity
                        style={styles.searchButton}
                        onPress={buscarRepuestoProveedor}
                        accessibilityRole="button"
                        accessibilityLabel="Buscar repuesto en proveedores"
                      >
                        <MaterialIcons
                          name="search"
                          size={16}
                          color={Colors.cream}
                        />
                        <Text style={styles.searchButtonText}>BUSCAR</Text>
                      </TouchableOpacity>
                    )
                  }
                />
                <Text style={styles.searchHint}>
                  Busca y selecciona un repuesto para asignar su código.
                </Text>
                {form.codigo_item ? (
                  <Text style={styles.selectedCode}>
                    Código seleccionado: {form.codigo_item}
                  </Text>
                ) : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>
                  CATEGORÍA <Text style={styles.req}>*</Text>
                </Text>
                {categorias.length === 0 ? (
                  <ActivityIndicator
                    color={Colors.primary}
                    style={{ marginTop: sp(12) }}
                  />
                ) : (
                  <View style={styles.selectWrapper}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
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
                      <Text style={styles.errorText}>
                        {errores.id_categoria}
                      </Text>
                    ) : null}
                  </View>
                )}
              </View>
            </View>

            {repuestosEncontrados.length > 0 ? (
              <View style={styles.searchResults}>
                <Text style={styles.searchResultsTitle}>
                  SELECCIONA UN REPUESTO
                </Text>
                {repuestosEncontrados.map((resultado) => {
                  const { mejorOferta, cantidadOfertas } = resultado;

                  return (
                    <TouchableOpacity
                      key={mejorOferta.codigo}
                      style={styles.searchResultCard}
                      onPress={() =>
                        seleccionarRepuestoProveedor(resultado)
                      }
                    >
                      <View style={styles.searchResultInfo}>
                        <Text style={styles.searchResultName}>
                          {mejorOferta.nombre}
                        </Text>
                        <Text style={styles.searchResultDetail}>
                          {mejorOferta.codigo}
                          {mejorOferta.marca
                            ? ` · ${mejorOferta.marca}`
                            : ""}
                        </Text>
                      </View>
                      <View style={styles.searchResultPrice}>
                        <Text style={styles.searchResultPriceText}>
                          Desde ₡
                          {mejorOferta.precio.toLocaleString("es-CR")}
                        </Text>
                        <Text style={styles.searchResultOffers}>
                          {cantidadOfertas} oferta(s)
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}
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
                <View>
                  <Text style={styles.estadoTitle}>Estado actual</Text>
                  <Text style={styles.estadoHint}>
                    Se calcula según la cantidad disponible y la mínima.
                  </Text>
                </View>
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

// Estilos visuales del formulario de nuevo producto.
const createStyles = (Colors: AppColors) => StyleSheet.create({
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
    color: Colors.white,
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
  req: { color: Colors.danger },
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
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
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
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
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
  estadoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: sp(10),
    flex: 1,
  },
  dot: { width: sp(10), height: sp(10), borderRadius: sp(5) },
  estadoTitle: { fontSize: fs(13), fontWeight: "600", color: Colors.primary },
  estadoHint: { fontSize: fs(11), color: Colors.gray, marginTop: sp(2) },
  estadoBadge: {
    paddingHorizontal: sp(10),
    paddingVertical: sp(4),
    borderRadius: sp(4),
    borderWidth: 1,
  },
  estadoBadgeText: { fontSize: fs(11), fontWeight: "600", letterSpacing: 0.5 },
  errorText: { fontSize: fs(12), color: Colors.danger, marginTop: sp(4) },
  inputContainer: {
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: sp(10),
    paddingHorizontal: sp(10),
    backgroundColor: Colors.white,
  },
  inputContainerError: {
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: sp(6),
    paddingHorizontal: sp(10),
    backgroundColor: Colors.white,
  },
  inputText: { fontSize: fs(14), color: Colors.primary },
  inputWrapper: { paddingHorizontal: 0, marginBottom: sp(8) },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: sp(4),
    backgroundColor: Colors.accent,
    borderRadius: sp(5),
    paddingHorizontal: sp(8),
    paddingVertical: sp(6),
  },
  searchButtonText: {
    color: Colors.white,
    fontSize: fs(10),
    fontWeight: "700",
  },
  searchHint: {
    color: Colors.gray,
    fontSize: fs(11),
    marginTop: sp(-8),
    marginBottom: sp(8),
    marginLeft: sp(2),
  },
  selectedCode: {
    color: Colors.success,
    fontSize: fs(11),
    fontWeight: "600",
    marginBottom: sp(8),
    marginLeft: sp(2),
  },
  searchResults: {
    gap: sp(8),
    marginTop: sp(12),
  },
  searchResultsTitle: {
    color: Colors.gray,
    fontSize: fs(10),
    fontWeight: "600",
    letterSpacing: 1,
  },
  searchResultCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: sp(12),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: sp(8),
    padding: sp(12),
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    color: Colors.primary,
    fontSize: fs(13),
    fontWeight: "600",
  },
  searchResultDetail: {
    color: Colors.gray,
    fontSize: fs(11),
    marginTop: sp(3),
  },
  searchResultPrice: {
    alignItems: "flex-end",
  },
  searchResultPriceText: {
    color: Colors.success,
    fontSize: fs(12),
    fontWeight: "700",
  },
  searchResultOffers: {
    color: Colors.gray,
    fontSize: fs(10),
    marginTop: sp(3),
  },
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
  fabGuardar: { backgroundColor: Colors.accent },
  fabCancelar: { backgroundColor: Colors.danger },
  fabDisabled: { backgroundColor: Colors.disabled },
  footer: {
    textAlign: "center",
    fontSize: fs(11),
    color: Colors.gray,
    marginBottom: sp(32),
  },
});
