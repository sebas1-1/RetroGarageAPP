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
import { Auto, autosService } from "../../services/autosService";
import { citasService } from "../../services/citasService";
import { Cliente, clientesService } from "../../services/clientesService";

interface Servicio {
  id_servicio: number;
  nombre: string;
  precio_base: number;
}

// Pantalla para modificar una cita existente sin crear una nueva.
export default function EditarCitaScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Estados de carga, listas auxiliares, formulario y mensajes.
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [autosCliente, setAutosCliente] = useState<Auto[]>([]);
  const [cargandoAutos, setCargandoAutos] = useState(false);
  const [buscarCliente, setBuscarCliente] = useState("");
  const [form, setForm] = useState({
    id_cliente: "",
    id_servicio: "",
    marca_vehiculo: "",
    modelo_vehiculo: "",
    anio_vehiculo: "",
    fecha: "",
    hora: "",
    descripcion: "",
    estado: "PENDIENTE",
  });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [messageDialog, setMessageDialog] = useState<{
    title: string;
    message: string;
    onClose?: () => void;
  } | null>(null);

  // Cierra el dialogo y ejecuta una accion extra si el mensaje la necesita.
  const closeMessageDialog = () => {
    const onClose = messageDialog?.onClose;
    setMessageDialog(null);
    onClose?.();
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    cargarDatos();
  }, [id]);

  // Carga la cita actual junto con clientes y servicios para llenar el formulario.
  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [cita, cls, svcs] = (await Promise.all([
        citasService.getById(Number(id)),
        clientesService.getAll(),
        fetch("http://localhost:3001/api/servicios").then((r) => r.json()),
      ])) as [any, Cliente[], Servicio[]];
      setClientes(cls);
      setServicios(svcs);
      setForm({
        id_cliente: String(cita.id_cliente),
        id_servicio: String(cita.id_servicio),
        marca_vehiculo: cita.marca_vehiculo ?? "",
        modelo_vehiculo: cita.modelo_vehiculo ?? "",
        anio_vehiculo: cita.anio_vehiculo ? String(cita.anio_vehiculo) : "",
        fecha: cita.fecha ? cita.fecha.split("T")[0] : "",
        hora: cita.hora ? cita.hora.substring(0, 5) : "",
        descripcion: cita.descripcion ?? "",
        estado: cita.estado ?? "PENDIENTE",
      });

      const clienteCita = cls.find(
        (cliente) => cliente.id_cliente === cita.id_cliente,
      );
      if (clienteCita) cargarAutosCliente(clienteCita);
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

  const cargarAutosCliente = async (cliente: Cliente) => {
    try {
      setCargandoAutos(true);
      const autos = await autosService.getByIdentificacion(
        cliente.identificacion,
      );
      setAutosCliente(autos);
    } catch {
      setAutosCliente([]);
    } finally {
      setCargandoAutos(false);
    }
  };

  const seleccionarCliente = (cliente: Cliente) => {
    setForm((f) => ({
      ...f,
      id_cliente: String(cliente.id_cliente),
      marca_vehiculo: "",
      modelo_vehiculo: "",
      anio_vehiculo: "",
    }));
    cargarAutosCliente(cliente);
  };

  const seleccionarAuto = (auto: Auto) => {
    setForm((f) => ({
      ...f,
      marca_vehiculo: auto.marca ?? "",
      modelo_vehiculo: auto.modelo ?? "",
      anio_vehiculo: auto.anio ?? "",
    }));
  };

  // Revisa que los datos obligatorios esten completos y tengan formato correcto.
  const validar = () => {
    const e: Record<string, string> = {};

    // Primero se validan los campos basicos requeridos.
    if (!form.id_cliente) e.id_cliente = "Seleccione un cliente";
    if (!form.id_servicio) e.id_servicio = "Seleccione un servicio";
    if (!form.marca_vehiculo.trim()) e.marca_vehiculo = "Campo requerido";
    if (!form.modelo_vehiculo.trim()) e.modelo_vehiculo = "Campo requerido";

    const fechaValida = /^\d{4}-\d{2}-\d{2}$/.test(form.fecha);
    const horaValida = /^\d{2}:\d{2}$/.test(form.hora);

    // La fecha debe venir con formato YYYY-MM-DD y no puede ser del pasado.
    if (!form.fecha || !fechaValida) {
      e.fecha = "Formato inválido (YYYY-MM-DD)";
    } else {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const fechaCita = new Date(form.fecha + "T00:00:00");

      if (fechaCita < hoy) {
        e.fecha = "La fecha no puede ser anterior a hoy";
      }
    }

    // La hora debe venir con formato HH:MM y, si es hoy, debe ser futura.
    if (!form.hora || !horaValida) {
      e.hora = "Formato inválido (HH:MM)";
    } else if (!e.fecha && form.fecha) {
      const ahora = new Date();
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const fechaCita = new Date(form.fecha + "T00:00:00");
      const [hh, mm] = form.hora.split(":").map(Number);
      const horaCita = new Date(form.fecha + `T${form.hora}:00`);

      // Solo comparar hora si la cita es hoy
      if (fechaCita.getTime() === hoy.getTime() && horaCita <= ahora) {
        e.hora = "La hora debe ser posterior a la hora actual";
      }
    }

    // Guarda los errores para pintarlos debajo de cada campo.
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  // Si la validacion pasa, envia los cambios de la cita al backend.
  const guardar = async () => {
    if (!validar()) return;
    try {
      setGuardando(true);
      await citasService.editar(Number(id), {
        id_cliente: Number(form.id_cliente),
        id_servicio: Number(form.id_servicio),
        marca_vehiculo: form.marca_vehiculo,
        modelo_vehiculo: form.modelo_vehiculo,
        anio_vehiculo: form.anio_vehiculo ? Number(form.anio_vehiculo) : null,
        fecha: form.fecha,
        hora: form.hora,
        descripcion: form.descripcion || null,
        estado: form.estado,
      });
      setMessageDialog({
        title: "Listo",
        message: "Cita actualizada correctamente",
        onClose: () => router.back(),
      });
    } catch (e: any) {
      setMessageDialog({ title: "Error", message: e.message });
    } finally {
      setGuardando(false);
    }
  };

  // Centraliza las props de los inputs para no repetir estilos y errores.
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

  // Filtra clientes mientras el usuario escribe en el buscador.
  const clientesFiltrados = clientes.filter((c) =>
    `${c.nombre} ${c.apellido} ${c.identificacion}`
      .toLowerCase()
      .includes(buscarCliente.toLowerCase()),
  );

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
            <Text style={styles.title}>Editar cita</Text>
            <Text style={styles.subtitle}>Modificá los datos de la cita</Text>
          </View>

          <View style={styles.divider} />

          {/* Cliente */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CLIENTE</Text>
            <Input
              placeholder="Buscar cliente..."
              value={buscarCliente}
              onChangeText={setBuscarCliente}
              inputStyle={styles.inputText}
              inputContainerStyle={styles.inputContainer}
              containerStyle={styles.inputWrapper}
            />
            {errores.id_cliente ? (
              <Text style={styles.errorText}>{errores.id_cliente}</Text>
            ) : null}
            <ScrollView style={styles.listBox} nestedScrollEnabled>
              {clientesFiltrados.map((c) => (
                <TouchableOpacity
                  key={c.id_cliente}
                  style={[
                    styles.listItem,
                    form.id_cliente === String(c.id_cliente) &&
                      styles.listItemActive,
                  ]}
                  onPress={() => seleccionarCliente(c)}
                >
                  <Text
                    style={[
                      styles.listItemText,
                      form.id_cliente === String(c.id_cliente) &&
                        styles.listItemTextActive,
                    ]}
                  >
                    {c.nombre} {c.apellido} — {c.identificacion}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.divider} />

          {/* Servicio */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SERVICIO</Text>
            {errores.id_servicio ? (
              <Text style={styles.errorText}>{errores.id_servicio}</Text>
            ) : null}
            <View style={styles.serviciosGrid}>
              {servicios.map((s) => (
                <TouchableOpacity
                  key={s.id_servicio}
                  style={[
                    styles.servicioBtn,
                    form.id_servicio === String(s.id_servicio) &&
                      styles.servicioBtnActive,
                  ]}
                  onPress={() => set("id_servicio")(String(s.id_servicio))}
                >
                  <Text
                    style={[
                      styles.servicioBtnText,
                      form.id_servicio === String(s.id_servicio) &&
                        styles.servicioBtnTextActive,
                    ]}
                  >
                    {s.nombre}
                  </Text>
                  <Text
                    style={[
                      styles.servicioPrecio,
                      form.id_servicio === String(s.id_servicio) && {
                        color: Colors.cream,
                      },
                    ]}
                  >
                    ₡{s.precio_base.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Vehículo */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>VEHÍCULO</Text>

            {form.id_cliente ? (
              <View style={styles.autosBox}>
                {cargandoAutos ? (
                  <Text style={styles.helperText}>Cargando autos...</Text>
                ) : autosCliente.length > 0 ? (
                  autosCliente.map((auto) => {
                    const active =
                      form.marca_vehiculo === (auto.marca ?? "") &&
                      form.modelo_vehiculo === (auto.modelo ?? "") &&
                      form.anio_vehiculo === (auto.anio ?? "");

                    return (
                      <TouchableOpacity
                        key={
                          auto.id_auto ??
                          `${auto.marca}-${auto.modelo}-${auto.placa}`
                        }
                        style={[styles.autoBtn, active && styles.autoBtnActive]}
                        onPress={() => seleccionarAuto(auto)}
                      >
                        <Text
                          style={[
                            styles.autoBtnText,
                            active && styles.autoBtnTextActive,
                          ]}
                        >
                          {auto.marca || "Sin marca"} {auto.modelo || ""}
                          {auto.anio ? ` ${auto.anio}` : ""}
                        </Text>
                        {auto.placa ? (
                          <Text
                            style={[
                              styles.autoPlaca,
                              active && styles.autoBtnTextActive,
                            ]}
                          >
                            {auto.placa}
                          </Text>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <Text style={styles.helperText}>
                    Este cliente no tiene autos registrados
                  </Text>
                )}
              </View>
            ) : (
              <Text style={styles.helperText}>
                Seleccioná un cliente para ver sus autos
              </Text>
            )}

            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>
                  MARCA <Text style={styles.req}>*</Text>
                </Text>
                <Input
                  placeholder="Ej. Ford"
                  {...inputProps("marca_vehiculo")}
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>
                  MODELO <Text style={styles.req}>*</Text>
                </Text>
                <Input
                  placeholder="Ej. Mustang"
                  {...inputProps("modelo_vehiculo")}
                />
              </View>
            </View>
            <Text style={styles.fieldLabel}>AÑO</Text>
            <Input
              placeholder="Ej. 1968"
              keyboardType="numeric"
              {...inputProps("anio_vehiculo")}
            />
          </View>

          <View style={styles.divider} />

          {/* Fecha y hora */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>FECHA Y HORA</Text>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>
                  FECHA <Text style={styles.req}>*</Text>
                </Text>
                <DatePickerField
                  value={form.fecha}
                  onChange={set("fecha")}
                  errorMessage={errores.fecha}
                  minimumDate={today}
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.fieldLabel}>
                  HORA <Text style={styles.req}>*</Text>
                </Text>
                <Input placeholder="HH:MM" {...inputProps("hora")} />
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Estado */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ESTADO</Text>
            <View style={styles.estadosRow}>
              {["PENDIENTE", "COMPLETADA", "CANCELADA"].map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[
                    styles.estadoBtn,
                    form.estado === e && styles.estadoBtnActive,
                  ]}
                  onPress={() => set("estado")(e)}
                >
                  <Text
                    style={[
                      styles.estadoBtnText,
                      form.estado === e && styles.estadoBtnTextActive,
                    ]}
                  >
                    {e}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Descripción */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DESCRIPCIÓN</Text>
            <Text style={styles.fieldLabel}>OBSERVACIONES</Text>
            <Input
              placeholder="Detalles adicionales..."
              multiline
              numberOfLines={3}
              {...inputProps("descripcion")}
              inputContainerStyle={[
                styles.inputContainer,
                { height: sp(80), alignItems: "flex-start" },
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

// Estilos visuales del formulario de editar cita.
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
  row: { flexDirection: "row", gap: sp(12) },
  halfField: { flex: 1 },
  listBox: {
    maxHeight: sp(180),
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: sp(8),
    backgroundColor: Colors.white,
    marginBottom: sp(8),
  },
  listItem: {
    paddingHorizontal: sp(14),
    paddingVertical: sp(10),
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  listItemActive: { backgroundColor: Colors.primary },
  listItemText: { fontSize: fs(13), color: Colors.primary },
  listItemTextActive: { color: Colors.cream },
  autosBox: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: sp(8),
    marginBottom: sp(12),
  },
  helperText: {
    color: Colors.gray,
    fontSize: fs(13),
    marginLeft: sp(10),
    marginBottom: sp(10),
  },
  autoBtn: {
    paddingHorizontal: sp(14),
    paddingVertical: sp(10),
    borderRadius: sp(8),
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  autoBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  autoBtnText: {
    color: Colors.primary,
    fontSize: fs(13),
    fontWeight: "600",
  },
  autoBtnTextActive: { color: Colors.cream },
  autoPlaca: {
    color: Colors.gray,
    fontSize: fs(11),
    marginTop: sp(2),
  },
  serviciosGrid: { flexDirection: "row", flexWrap: "wrap", gap: sp(8) },
  servicioBtn: {
    paddingHorizontal: sp(14),
    paddingVertical: sp(10),
    borderRadius: sp(8),
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  servicioBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  servicioBtnText: {
    fontSize: fs(13),
    color: Colors.primary,
    fontWeight: "500",
  },
  servicioBtnTextActive: { color: Colors.cream },
  servicioPrecio: { fontSize: fs(11), color: Colors.gray, marginTop: sp(2) },
  estadosRow: { flexDirection: "row", gap: sp(8) },
  estadoBtn: {
    paddingHorizontal: sp(14),
    paddingVertical: sp(8),
    borderRadius: sp(20),
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  estadoBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  estadoBtnText: { fontSize: fs(12), color: Colors.primary, fontWeight: "600" },
  estadoBtnTextActive: { color: Colors.cream },
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
