import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Input, Text } from "@rneui/themed";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
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
import { Cita, citasService } from "../../services/citasService";
import { inventarioService, Producto } from "../../services/inventarioService";
import {
  ItemCarrito,
  MetodoPago,
  pagosService,
} from "../../services/pagosService";
import { Servicio, serviciosService } from "../../services/serviciosService";

// Bancos disponibles cuando el metodo de pago necesita referencia.
const BANCOS = [
  "BCR",
  "BNCR",
  "BAC",
  "Scotiabank",
  "Davivienda",
  "Popular",
  "Promerica",
];

// Pasos del flujo para que el pago se registre de forma ordenada.
const PASO_TIPO = 1;
const PASO_DETALLE = 2;
const PASO_PAGO = 3;

// Pantalla en pasos para registrar un pago ligado a cita o venta directa.
export default function NuevoPagoScreen() {
  const router = useRouter();

  // Paso actual del flujo y tipo de pago que eligio el usuario.
  const [paso, setPaso] = useState(PASO_TIPO);
  const [tipo, setTipo] = useState<"cita" | "directo" | null>(null);

  // Datos para buscar y seleccionar una cita pendiente.
  const [buscarCita, setBuscarCita] = useState("");
  const [citas, setCitas] = useState<Cita[]>([]);
  const [citaSeleccionada, setCitaSeleccionada] = useState<Cita | null>(null);
  const [buscandoCitas, setBuscandoCitas] = useState(false);
  const [servicios, setServicios] = useState<Servicio[]>([]);

  // Datos para buscar productos y armar el carrito del pago.
  const [buscarProducto, setBuscarProducto] = useState("");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [buscandoProductos, setBuscandoProductos] = useState(false);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);

  // Datos finales del metodo de pago y comprobante.
  const [metodos, setMetodos] = useState<MetodoPago[]>([]);
  const [metodoSeleccionado, setMetodoSeleccionado] =
    useState<MetodoPago | null>(null);
  const [montoRecibido, setMontoRecibido] = useState("");
  const [referencia, setReferencia] = useState("");
  const [banco, setBanco] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [messageDialog, setMessageDialog] = useState<{
    title: string;
    message: string;
    onClose?: () => void;
  } | null>(null);

  const searchTimeout = useRef<any>(null);

  // Al abrir la pantalla se cargan metodos, productos y servicios base.
  useEffect(() => {
    pagosService
      .getMetodos()
      .then(setMetodos)
      .catch(() => {});
    inventarioService
      .getAll()
      .then(setProductos)
      .catch(() => {});
    serviciosService
      .getAll()
      .then((data) => setServicios(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // Busca citas con una pequena espera para no llamar la API en cada tecla.
  useEffect(() => {
    if (!buscarCita.trim()) {
      setCitas([]);
      return;
    }
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      try {
        setBuscandoCitas(true);
        const data = await citasService.getAll(buscarCita, "PENDIENTE");
        setCitas(data);
      } catch {
        setCitas([]);
      } finally {
        setBuscandoCitas(false);
      }
    }, 400);
  }, [buscarCita]);

  // Filtra productos localmente por nombre o codigo.
  const productosFiltrados = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(buscarProducto.toLowerCase()) ||
      p.codigo_item.toLowerCase().includes(buscarProducto.toLowerCase()),
  );

  // Agrega un producto al carrito o aumenta su cantidad si ya existe.
  const agregarAlCarrito = (producto: Producto) => {
    setCarrito((prev) => {
      const existe = prev.find((i) => i.id_producto === producto.id_producto);
      if (existe) {
        return prev.map((i) =>
          i.id_producto === producto.id_producto
            ? { ...i, cantidad: i.cantidad + 1 }
            : i,
        );
      }
      return [
        ...prev,
        {
          id_producto: producto.id_producto,
          nombre: producto.nombre,
          precio_unitario: producto.precio_venta,
          cantidad: 1,
          unidad_medida: producto.unidad_medida,
        },
      ];
    });
  };

  // Suma o resta unidades; si llega a cero se quita del carrito.
  const cambiarCantidad = (id: number, delta: number) => {
    setCarrito((prev) =>
      prev
        .map((i) =>
          i.id_producto === id ? { ...i, cantidad: i.cantidad + delta } : i,
        )
        .filter((i) => i.cantidad > 0),
    );
  };

  // Obtiene el precio de la cita usando el dato de la cita o el servicio base.
  const precioServicioCita = (cita: Cita) => {
    const servicio = servicios.find((s) => s.id_servicio === cita.id_servicio);
    return Number(cita.precio_base ?? servicio?.precio_base ?? 0);
  };

  const formatPrecioServicio = (monto: number) =>
    monto > 0 ? `₡${monto.toLocaleString()}` : "Precio no disponible";

  // Monto por servicio cuando el pago esta ligado a una cita.
  const montoServicio = citaSeleccionada
    ? precioServicioCita(citaSeleccionada)
    : 0;

  // Total de productos agregados al carrito.
  const montoProductos = carrito.reduce(
    (acc, i) => acc + i.precio_unitario * i.cantidad,
    0,
  );

  // Total final a cobrar.
  const montoTotal = montoServicio + montoProductos;

  // Cambio solo aplica cuando el metodo seleccionado es efectivo.
  const cambio =
    metodoSeleccionado?.nombre === "Efectivo" && montoRecibido
      ? Number(montoRecibido) - montoTotal
      : null;

  // Reglas simples para habilitar avance entre pasos y confirmacion.
  const puedeAvanzarPaso1 = tipo !== null;

  const puedeAvanzarPaso2 =
    tipo === "cita" ? citaSeleccionada !== null : carrito.length > 0;

  const puedeConfirmar =
    metodoSeleccionado !== null &&
    montoTotal > 0 &&
    (metodoSeleccionado.nombre !== "Efectivo" ||
      (!!montoRecibido && Number(montoRecibido) >= montoTotal)) &&
    (metodoSeleccionado.nombre !== "Transferencia" || !!referencia);

  // Envia el pago completo al backend y muestra el numero de factura.
  const confirmarPago = async () => {
    if (!puedeConfirmar) return;
    try {
      setGuardando(true);
      const result = await pagosService.registrar({
        id_cita: citaSeleccionada?.id_cita ?? null,
        id_usuario: 1,
        id_metodo: metodoSeleccionado!.id_metodo,
        monto: montoTotal,
        monto_recibido:
          metodoSeleccionado!.nombre === "Efectivo"
            ? Number(montoRecibido)
            : null,
        cambio: cambio,
        numero_referencia: referencia || null,
        banco: banco || null,
        observaciones: observaciones || null,
        productos: carrito.map((i) => ({
          id_producto: i.id_producto,
          cantidad: i.cantidad,
          precio_unitario: i.precio_unitario,
        })),
      });
      setMessageDialog({
        title: "Pago registrado",
        message: `Factura ${result.numero_factura} generada correctamente.`,
        onClose: () => router.back(),
      });
    } catch (e: any) {
      setMessageDialog({ title: "Error", message: e.message });
    } finally {
      setGuardando(false);
    }
  };

  const closeMessageDialog = () => {
    const onClose = messageDialog?.onClose;
    setMessageDialog(null);
    onClose?.();
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
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>RETRO GARAGE</Text>
          <View style={{ width: sp(40) }} />
        </View>

        {/* Indicador de pasos */}
        <View style={styles.stepsRow}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  paso >= s && styles.stepCircleActive,
                ]}
              >
                <Text
                  style={[styles.stepNum, paso >= s && styles.stepNumActive]}
                >
                  {s}
                </Text>
              </View>
              <Text
                style={[styles.stepLabel, paso >= s && styles.stepLabelActive]}
              >
                {s === 1 ? "Tipo" : s === 2 ? "Detalle" : "Pago"}
              </Text>
              {s < 3 && (
                <View
                  style={[styles.stepLine, paso > s && styles.stepLineActive]}
                />
              )}
            </View>
          ))}
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* ── PASO 1: TIPO ── */}
          {paso === PASO_TIPO && (
            <View style={styles.section}>
              <Text style={styles.title}>Registrar pago</Text>
              <Text style={styles.subtitle}>¿Cómo es esta venta?</Text>

              <View style={styles.divider} />

              <TouchableOpacity
                style={[
                  styles.tipoCard,
                  tipo === "cita" && styles.tipoCardActive,
                ]}
                onPress={() => setTipo("cita")}
              >
                <View style={styles.tipoIconBox}>
                  <MaterialIcons
                    name="event"
                    size={28}
                    color={tipo === "cita" ? Colors.cream : Colors.primary}
                  />
                </View>
                <View style={styles.tipoInfo}>
                  <Text
                    style={[
                      styles.tipoLabel,
                      tipo === "cita" && styles.tipoLabelActive,
                    ]}
                  >
                    Pago de cita
                  </Text>
                  <Text
                    style={[
                      styles.tipoSub,
                      tipo === "cita" && styles.tipoSubActive,
                    ]}
                  >
                    Cobrar un servicio agendado
                  </Text>
                </View>
                {tipo === "cita" && (
                  <MaterialIcons
                    name="check-circle"
                    size={22}
                    color={Colors.cream}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tipoCard,
                  tipo === "directo" && styles.tipoCardActive,
                ]}
                onPress={() => setTipo("directo")}
              >
                <View style={styles.tipoIconBox}>
                  <MaterialIcons
                    name="shopping-cart"
                    size={28}
                    color={tipo === "directo" ? Colors.cream : Colors.primary}
                  />
                </View>
                <View style={styles.tipoInfo}>
                  <Text
                    style={[
                      styles.tipoLabel,
                      tipo === "directo" && styles.tipoLabelActive,
                    ]}
                  >
                    Venta directa
                  </Text>
                  <Text
                    style={[
                      styles.tipoSub,
                      tipo === "directo" && styles.tipoSubActive,
                    ]}
                  >
                    Venta de productos sin cita
                  </Text>
                </View>
                {tipo === "directo" && (
                  <MaterialIcons
                    name="check-circle"
                    size={22}
                    color={Colors.cream}
                  />
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ── PASO 2: DETALLE ── */}
          {paso === PASO_DETALLE && (
            <View style={styles.section}>
              <Text style={styles.title}>
                {tipo === "cita" ? "Seleccionar cita" : "Agregar productos"}
              </Text>
              <Text style={styles.subtitle}>
                {tipo === "cita"
                  ? "Buscá la cita a cobrar y agregá productos si usaste repuestos"
                  : "Agregá los productos que se van a vender"}
              </Text>

              <View style={styles.divider} />

              {/* Buscar cita */}
              {tipo === "cita" && (
                <View style={styles.block}>
                  <Text style={styles.sectionLabel}>CITA</Text>
                  <Input
                    placeholder="Buscar por cliente o vehículo..."
                    value={buscarCita}
                    onChangeText={setBuscarCita}
                    leftIcon={
                      <MaterialIcons
                        name="search"
                        size={20}
                        color={Colors.gray}
                      />
                    }
                    inputStyle={styles.inputText}
                    inputContainerStyle={styles.inputContainer}
                    containerStyle={styles.inputWrapper}
                  />
                  {buscandoCitas && (
                    <ActivityIndicator color={Colors.primary} />
                  )}
                  {citas.map((cita) => (
                    <TouchableOpacity
                      key={cita.id_cita}
                      style={[
                        styles.citaCard,
                        citaSeleccionada?.id_cita === cita.id_cita &&
                          styles.citaCardActive,
                      ]}
                      onPress={() => {
                        setCitaSeleccionada(cita);
                        setBuscarCita("");
                        setCitas([]);
                      }}
                    >
                      <Text style={styles.citaNombre}>{cita.cliente}</Text>
                      <Text style={styles.citaSub}>
                        {cita.marca_vehiculo} {cita.modelo_vehiculo} ·{" "}
                        {cita.servicio}
                      </Text>
                      <Text style={styles.citaFecha}>
                        {cita.fecha} {cita.hora}
                      </Text>
                      <Text style={styles.citaPrecio}>
                        Servicio: {formatPrecioServicio(precioServicioCita(cita))}
                      </Text>
                    </TouchableOpacity>
                  ))}

                  {citaSeleccionada && (
                    <View style={styles.citaResumen}>
                      <View style={styles.citaResumenRow}>
                        <MaterialIcons
                          name="person"
                          size={16}
                          color={Colors.gray}
                        />
                        <Text style={styles.citaResumenLabel}>Cliente</Text>
                        <Text style={styles.citaResumenVal}>
                          {citaSeleccionada.cliente}
                        </Text>
                      </View>
                      <View style={styles.citaResumenRow}>
                        <MaterialIcons
                          name="directions-car"
                          size={16}
                          color={Colors.gray}
                        />
                        <Text style={styles.citaResumenLabel}>Vehículo</Text>
                        <Text style={styles.citaResumenVal}>
                          {citaSeleccionada.marca_vehiculo}{" "}
                          {citaSeleccionada.modelo_vehiculo}
                        </Text>
                      </View>
                      <View style={styles.citaResumenRow}>
                        <MaterialIcons
                          name="build"
                          size={16}
                          color={Colors.gray}
                        />
                        <Text style={styles.citaResumenLabel}>Servicio</Text>
                        <Text style={styles.citaResumenVal}>
                          {citaSeleccionada.servicio}
                        </Text>
                      </View>
                      <View style={styles.citaResumenRow}>
                        <MaterialIcons
                          name="payments"
                          size={16}
                          color={Colors.gray}
                        />
                        <Text style={styles.citaResumenLabel}>Costo</Text>
                        <Text style={styles.citaResumenVal}>
                          {formatPrecioServicio(montoServicio)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.cambiarCitaBtn}
                        onPress={() => setCitaSeleccionada(null)}
                      >
                        <Text style={styles.cambiarCitaText}>Cambiar cita</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.divider} />

              {/* Buscar productos */}
              <View style={styles.block}>
                <Text style={styles.sectionLabel}>
                  {tipo === "cita"
                    ? "PRODUCTOS USADOS (opcional)"
                    : "PRODUCTOS"}
                </Text>
                <Input
                  placeholder="Buscar producto por nombre o código..."
                  value={buscarProducto}
                  onChangeText={setBuscarProducto}
                  leftIcon={
                    <MaterialIcons
                      name="search"
                      size={20}
                      color={Colors.gray}
                    />
                  }
                  inputStyle={styles.inputText}
                  inputContainerStyle={styles.inputContainer}
                  containerStyle={styles.inputWrapper}
                />
                {buscarProducto.trim() ? (
                  <View style={styles.productosList}>
                    {productosFiltrados.slice(0, 5).map((p) => (
                      <TouchableOpacity
                        key={p.id_producto}
                        style={styles.productoItem}
                        onPress={() => {
                          agregarAlCarrito(p);
                          setBuscarProducto("");
                        }}
                      >
                        <View style={styles.productoItemLeft}>
                          <Text style={styles.productoItemNombre}>
                            {p.nombre}
                          </Text>
                          <Text style={styles.productoItemSub}>
                            {p.codigo_item} · Stock: {p.stock_actual}
                          </Text>
                        </View>
                        <Text style={styles.productoItemPrecio}>
                          ₡{p.precio_venta.toLocaleString()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    {productosFiltrados.length === 0 && (
                      <Text style={styles.sinResultados}>Sin resultados</Text>
                    )}
                  </View>
                ) : null}

                {/* Carrito */}
                {carrito.length > 0 && (
                  <View style={styles.carrito}>
                    <Text style={styles.carritoTitle}>CARRITO</Text>
                    {carrito.map((item) => (
                      <View key={item.id_producto} style={styles.carritoItem}>
                        <View style={styles.carritoItemInfo}>
                          <Text style={styles.carritoItemNombre}>
                            {item.nombre}
                          </Text>
                          <Text style={styles.carritoItemPrecio}>
                            ₡{item.precio_unitario.toLocaleString()} /{" "}
                            {item.unidad_medida.toLowerCase()}
                          </Text>
                        </View>
                        <View style={styles.cantidadRow}>
                          <TouchableOpacity
                            style={styles.cantBtn}
                            onPress={() =>
                              cambiarCantidad(item.id_producto, -1)
                            }
                          >
                            <Text style={styles.cantBtnText}>−</Text>
                          </TouchableOpacity>
                          <Text style={styles.cantNum}>{item.cantidad}</Text>
                          <TouchableOpacity
                            style={styles.cantBtn}
                            onPress={() => cambiarCantidad(item.id_producto, 1)}
                          >
                            <Text style={styles.cantBtnText}>+</Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.carritoItemTotal}>
                          ₡
                          {(
                            item.precio_unitario * item.cantidad
                          ).toLocaleString()}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Resumen de monto */}
              <View style={styles.montoResumen}>
                {tipo === "cita" && montoServicio > 0 && (
                  <View style={styles.montoRow}>
                    <Text style={styles.montoLabel}>Servicio</Text>
                    <Text style={styles.montoVal}>
                      ₡{montoServicio.toLocaleString()}
                    </Text>
                  </View>
                )}
                {carrito.length > 0 && (
                  <View style={styles.montoRow}>
                    <Text style={styles.montoLabel}>Productos</Text>
                    <Text style={styles.montoVal}>
                      ₡{montoProductos.toLocaleString()}
                    </Text>
                  </View>
                )}
                <View style={[styles.montoRow, styles.montoTotalRow]}>
                  <Text style={styles.montoTotalLabel}>TOTAL</Text>
                  <Text style={styles.montoTotalVal}>
                    ₡{montoTotal.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* ── PASO 3: PAGO ── */}
          {paso === PASO_PAGO && (
            <View style={styles.section}>
              <Text style={styles.title}>Método de pago</Text>
              <Text style={styles.subtitle}>
                Total a cobrar: ₡{montoTotal.toLocaleString()}
              </Text>

              <View style={styles.divider} />

              {/* Métodos */}
              <Text style={styles.sectionLabel}>MÉTODO</Text>
              <View style={styles.metodosRow}>
                {metodos.map((m) => (
                  <TouchableOpacity
                    key={m.id_metodo}
                    style={[
                      styles.metodoCard,
                      metodoSeleccionado?.id_metodo === m.id_metodo &&
                        styles.metodoCardActive,
                    ]}
                    onPress={() => setMetodoSeleccionado(m)}
                  >
                    <MaterialIcons
                      name={
                        m.nombre === "Efectivo"
                          ? "attach-money"
                          : m.nombre === "Tarjeta"
                            ? "credit-card"
                            : "account-balance"
                      }
                      size={28}
                      color={
                        metodoSeleccionado?.id_metodo === m.id_metodo
                          ? Colors.cream
                          : Colors.primary
                      }
                    />
                    <Text
                      style={[
                        styles.metodoLabel,
                        metodoSeleccionado?.id_metodo === m.id_metodo &&
                          styles.metodoLabelActive,
                      ]}
                    >
                      {m.nombre}
                    </Text>
                    {metodoSeleccionado?.id_metodo === m.id_metodo && (
                      <View style={styles.metodoBadge}>
                        <MaterialIcons
                          name="check"
                          size={14}
                          color={Colors.cream}
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Efectivo */}
              {metodoSeleccionado?.nombre === "Efectivo" && (
                <View style={styles.block}>
                  <Text style={styles.sectionLabel}>EFECTIVO</Text>
                  <Text style={styles.fieldLabel}>
                    MONTO RECIBIDO <Text style={styles.req}>*</Text>
                  </Text>
                  <Input
                    placeholder="₡0"
                    keyboardType="numeric"
                    value={montoRecibido}
                    onChangeText={setMontoRecibido}
                    inputStyle={styles.inputText}
                    inputContainerStyle={styles.inputContainer}
                    containerStyle={styles.inputWrapper}
                  />
                  {montoRecibido && Number(montoRecibido) >= montoTotal ? (
                    <View style={styles.cambioBox}>
                      <Text style={styles.cambioLabel}>CAMBIO</Text>
                      <Text style={styles.cambioVal}>
                        ₡{(Number(montoRecibido) - montoTotal).toLocaleString()}
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}

              {/* Tarjeta */}
              {metodoSeleccionado?.nombre === "Tarjeta" && (
                <View style={styles.block}>
                  <Text style={styles.sectionLabel}>TARJETA</Text>
                  <Text style={styles.fieldLabel}>
                    NÚMERO DE AUTORIZACIÓN (opcional)
                  </Text>
                  <Input
                    placeholder="Ej: 123456"
                    value={referencia}
                    onChangeText={setReferencia}
                    inputStyle={styles.inputText}
                    inputContainerStyle={styles.inputContainer}
                    containerStyle={styles.inputWrapper}
                  />
                </View>
              )}

              {/* Transferencia */}
              {metodoSeleccionado?.nombre === "Transferencia" && (
                <View style={styles.block}>
                  <Text style={styles.sectionLabel}>TRANSFERENCIA</Text>
                  <Text style={styles.fieldLabel}>
                    NÚMERO DE COMPROBANTE <Text style={styles.req}>*</Text>
                  </Text>
                  <Input
                    placeholder="Ej: 987654321"
                    value={referencia}
                    onChangeText={setReferencia}
                    inputStyle={styles.inputText}
                    inputContainerStyle={styles.inputContainer}
                    containerStyle={styles.inputWrapper}
                  />
                  <Text style={styles.fieldLabel}>BANCO (opcional)</Text>
                  <View style={styles.bancosRow}>
                    {BANCOS.map((b) => (
                      <TouchableOpacity
                        key={b}
                        style={[
                          styles.bancoChip,
                          banco === b && styles.bancoChipActive,
                        ]}
                        onPress={() => setBanco(banco === b ? "" : b)}
                      >
                        <Text
                          style={[
                            styles.bancoChipText,
                            banco === b && styles.bancoChipTextActive,
                          ]}
                        >
                          {b}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Observaciones */}
              <View style={styles.block}>
                <Text style={styles.fieldLabel}>OBSERVACIONES (opcional)</Text>
                <Input
                  placeholder="Agregar observaciones..."
                  value={observaciones}
                  onChangeText={setObservaciones}
                  multiline
                  numberOfLines={3}
                  inputStyle={[
                    styles.inputText,
                    { minHeight: sp(80), textAlignVertical: "top" },
                  ]}
                  inputContainerStyle={styles.inputContainer}
                  containerStyle={styles.inputWrapper}
                />
              </View>

              {/* Resumen final */}
              <View style={styles.montoResumen}>
                {tipo === "cita" && montoServicio > 0 && (
                  <View style={styles.montoRow}>
                    <Text style={styles.montoLabel}>Servicio</Text>
                    <Text style={styles.montoVal}>
                      ₡{montoServicio.toLocaleString()}
                    </Text>
                  </View>
                )}
                {carrito.length > 0 && (
                  <View style={styles.montoRow}>
                    <Text style={styles.montoLabel}>
                      Productos ({carrito.length})
                    </Text>
                    <Text style={styles.montoVal}>
                      ₡{montoProductos.toLocaleString()}
                    </Text>
                  </View>
                )}
                <View style={[styles.montoRow, styles.montoTotalRow]}>
                  <Text style={styles.montoTotalLabel}>TOTAL</Text>
                  <Text style={styles.montoTotalVal}>
                    ₡{montoTotal.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={{ height: sp(120) }} />
        </ScrollView>

        {/* Botones de navegación */}
        <View style={styles.navRow}>
          {paso > 1 && (
            <TouchableOpacity
              style={styles.navBtnSecundario}
              onPress={() => setPaso((p) => p - 1)}
            >
              <Text style={styles.navBtnSecundarioText}>← Atrás</Text>
            </TouchableOpacity>
          )}

          {paso < 3 && (
            <TouchableOpacity
              style={[
                styles.navBtnPrimario,
                !(paso === 1 ? puedeAvanzarPaso1 : puedeAvanzarPaso2) &&
                  styles.navBtnDisabled,
              ]}
              onPress={() => setPaso((p) => p + 1)}
              disabled={!(paso === 1 ? puedeAvanzarPaso1 : puedeAvanzarPaso2)}
            >
              <Text style={styles.navBtnPrimarioText}>Siguiente →</Text>
            </TouchableOpacity>
          )}

          {paso === 3 && (
            <TouchableOpacity
              style={[
                styles.navBtnPrimario,
                (!puedeConfirmar || guardando) && styles.navBtnDisabled,
              ]}
              onPress={confirmarPago}
              disabled={!puedeConfirmar || guardando}
            >
              {guardando ? (
                <ActivityIndicator color="white" />
              ) : (
                <View style={styles.registrarBtnInner}>
                  <MaterialIcons
                    name="receipt"
                    size={16}
                    color="white"
                    style={{ marginRight: sp(8) }}
                  />
                  <Text style={styles.navBtnPrimarioText}>Registrar pago</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>

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

// Estilos visuales del formulario de pagos.
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
  backBtn: { width: sp(40) },
  backIcon: { color: Colors.white, fontSize: fs(20) },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: fs(14),
    fontWeight: "600",
    letterSpacing: 2,
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: sp(16),
    paddingHorizontal: sp(20),
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stepItem: { flexDirection: "row", alignItems: "center" },
  stepCircle: {
    width: sp(28),
    height: sp(28),
    borderRadius: sp(14),
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  stepCircleActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  stepNum: { fontSize: fs(12), fontWeight: "600", color: Colors.gray },
  stepNumActive: { color: Colors.cream },
  stepLabel: {
    fontSize: fs(11),
    color: Colors.gray,
    marginLeft: sp(6),
    fontWeight: "500",
  },
  stepLabelActive: { color: Colors.primary },
  stepLine: {
    width: sp(32),
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: sp(6),
  },
  stepLineActive: { backgroundColor: Colors.primary },
  scroll: { flex: 1, paddingHorizontal: sp(20) },
  section: { paddingTop: sp(20) },
  title: { fontSize: fs(22), fontWeight: "600", color: Colors.primary },
  subtitle: { fontSize: fs(13), color: Colors.gray, marginTop: sp(4) },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: sp(16),
  },
  block: { marginBottom: sp(16) },
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
  inputContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: sp(6),
    paddingHorizontal: sp(10),
    backgroundColor: Colors.white,
  },
  inputText: { fontSize: fs(14), color: Colors.primary },
  inputWrapper: { paddingHorizontal: 0, marginBottom: sp(8) },
  tipoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: sp(10),
    borderWidth: 1,
    borderColor: Colors.border,
    padding: sp(18),
    marginBottom: sp(12),
  },
  tipoCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tipoIconBox: {
    width: sp(48),
    height: sp(48),
    borderRadius: sp(10),
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: sp(14),
  },
  tipoInfo: { flex: 1 },
  tipoLabel: { fontSize: fs(16), fontWeight: "600", color: Colors.primary },
  tipoLabelActive: { color: Colors.cream },
  tipoSub: { fontSize: fs(12), color: Colors.gray, marginTop: sp(2) },
  tipoSubActive: { color: "rgba(255,255,255,0.7)" },
  citaCard: {
    backgroundColor: Colors.white,
    borderRadius: sp(8),
    borderWidth: 1,
    borderColor: Colors.border,
    padding: sp(12),
    marginBottom: sp(8),
  },
  citaCardActive: { borderColor: Colors.primary, borderWidth: 2 },
  citaNombre: { fontSize: fs(14), fontWeight: "600", color: Colors.primary },
  citaSub: { fontSize: fs(12), color: Colors.gray, marginTop: sp(2) },
  citaFecha: { fontSize: fs(11), color: Colors.gray, marginTop: sp(2) },
  citaPrecio: {
    fontSize: fs(12),
    color: Colors.success,
    fontWeight: "600",
    marginTop: sp(4),
  },
  citaResumen: {
    backgroundColor: Colors.white,
    borderRadius: sp(8),
    borderWidth: 1,
    borderColor: Colors.primary,
    padding: sp(14),
    marginTop: sp(8),
  },
  citaResumenRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: sp(6),
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  citaResumenLabel: {
    fontSize: fs(12),
    color: Colors.gray,
    width: sp(70),
    marginLeft: sp(8),
  },
  citaResumenVal: {
    fontSize: fs(13),
    fontWeight: "500",
    color: Colors.primary,
    flex: 1,
  },
  cambiarCitaBtn: { alignItems: "center", paddingTop: sp(10) },
  cambiarCitaText: { fontSize: fs(12), color: "#993C1D", fontWeight: "600" },
  productosList: {
    backgroundColor: Colors.white,
    borderRadius: sp(8),
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: sp(8),
    overflow: "hidden",
  },
  productoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: sp(12),
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  productoItemLeft: { flex: 1 },
  productoItemNombre: {
    fontSize: fs(13),
    fontWeight: "600",
    color: Colors.primary,
  },
  productoItemSub: { fontSize: fs(11), color: Colors.gray, marginTop: sp(2) },
  productoItemPrecio: { fontSize: fs(13), fontWeight: "600", color: "#0F6E56" },
  sinResultados: {
    textAlign: "center",
    color: Colors.gray,
    fontSize: fs(13),
    padding: sp(16),
  },
  carrito: {
    backgroundColor: Colors.white,
    borderRadius: sp(8),
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    marginTop: sp(8),
  },
  carritoTitle: {
    fontSize: fs(11),
    fontWeight: "600",
    color: Colors.gray,
    letterSpacing: 1.5,
    padding: sp(12),
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  carritoItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: sp(12),
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  carritoItemInfo: { flex: 1, marginRight: sp(8) },
  carritoItemNombre: {
    fontSize: fs(13),
    fontWeight: "600",
    color: Colors.primary,
  },
  carritoItemPrecio: { fontSize: fs(11), color: Colors.gray, marginTop: sp(2) },
  cantidadRow: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: sp(8),
  },
  cantBtn: {
    width: sp(28),
    height: sp(28),
    borderRadius: sp(14),
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  cantBtnText: { fontSize: fs(16), fontWeight: "600", color: Colors.primary },
  cantNum: {
    fontSize: fs(14),
    fontWeight: "600",
    color: Colors.primary,
    minWidth: sp(20),
    textAlign: "center",
    marginHorizontal: sp(8),
  },
  carritoItemTotal: {
    fontSize: fs(13),
    fontWeight: "600",
    color: "#0F6E56",
    minWidth: sp(70),
    textAlign: "right",
  },
  montoResumen: {
    backgroundColor: Colors.white,
    borderRadius: sp(8),
    borderWidth: 1,
    borderColor: Colors.border,
    padding: sp(14),
    marginTop: sp(8),
  },
  montoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: sp(6),
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  montoTotalRow: { borderBottomWidth: 0, marginTop: sp(4) },
  montoLabel: { fontSize: fs(13), color: Colors.gray },
  montoVal: { fontSize: fs(13), color: Colors.primary, fontWeight: "500" },
  montoTotalLabel: {
    fontSize: fs(15),
    fontWeight: "700",
    color: Colors.primary,
  },
  montoTotalVal: { fontSize: fs(18), fontWeight: "700", color: Colors.primary },
  metodosRow: {
    flexDirection: "row",
    marginBottom: sp(16),
  },
  metodoCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: sp(10),
    borderWidth: 1,
    borderColor: Colors.border,
    padding: sp(14),
    alignItems: "center",
    marginRight: sp(10),
  },
  metodoCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  metodoLabel: {
    fontSize: fs(11),
    fontWeight: "600",
    color: Colors.primary,
    textAlign: "center",
    marginTop: sp(6),
  },
  metodoLabelActive: { color: Colors.cream },
  metodoBadge: {
    position: "absolute",
    top: sp(6),
    right: sp(6),
    backgroundColor: "#0F6E56",
    borderRadius: sp(10),
    width: sp(18),
    height: sp(18),
    justifyContent: "center",
    alignItems: "center",
  },
  cambioBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    borderRadius: sp(8),
    padding: sp(14),
    marginTop: sp(4),
  },
  cambioLabel: { fontSize: fs(13), fontWeight: "600", color: "#2E7D32" },
  cambioVal: { fontSize: fs(20), fontWeight: "700", color: "#2E7D32" },
  bancosRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginLeft: sp(10),
    marginBottom: sp(8),
  },
  bancoChip: {
    paddingHorizontal: sp(12),
    paddingVertical: sp(7),
    borderRadius: sp(6),
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    marginRight: sp(8),
    marginBottom: sp(8),
  },
  bancoChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  bancoChipText: { fontSize: fs(12), color: Colors.primary, fontWeight: "500" },
  bancoChipTextActive: { color: Colors.cream },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: sp(20),
    paddingVertical: sp(16),
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  navBtnSecundario: {
    flex: 1,
    paddingVertical: sp(14),
    borderRadius: sp(8),
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    marginRight: sp(12),
  },
  navBtnSecundarioText: {
    fontSize: fs(14),
    fontWeight: "600",
    color: Colors.primary,
  },
  navBtnPrimario: {
    flex: 2,
    paddingVertical: sp(14),
    borderRadius: sp(8),
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  navBtnDisabled: { backgroundColor: Colors.gray },
  navBtnPrimarioText: {
    fontSize: fs(14),
    fontWeight: "600",
    color: Colors.cream,
  },
  registrarBtnInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  footer: {
    textAlign: "center",
    fontSize: fs(11),
    color: Colors.gray,
    marginBottom: sp(32),
  },
});
