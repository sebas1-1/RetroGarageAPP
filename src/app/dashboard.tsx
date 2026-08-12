import { useThemedStyles } from "@/contexts/AccessibilityThemeContext";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Text } from "@rneui/themed";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import type { AppColors } from "../constants/colors";
import { fs, screen, sp } from "../constants/responsive";
import { Cita, citasService } from "../services/citasService";
import { pagosService } from "../services/pagosService";

interface PagoDashboard {
  id_pago: number;
  fecha?: string;
  fecha_pago?: string;
  monto: number;
}

interface IngresosDashboard {
  hoy: number;
  ayer: number;
  mes: number;
  mesAnterior: number;
}

// Accesos que aparecen como botones rapidos en el dashboard.
const ACCESOS = [
  { icon: "event", label: "Nueva cita", sub: "Agendar", ruta: "/citas/nuevo" },
  {
    icon: "payments",
    label: "Registrar pago",
    sub: "Cobrar servicio",
    ruta: "/pagos/nuevo",
  },
  {
    icon: "person-add",
    label: "Nuevo cliente",
    sub: "Registrar",
    ruta: "/clientes/nuevo",
  },
  {
    icon: "bar-chart",
    label: "Estadísticas",
    sub: "Ver reporte",
    ruta: "/estadisticas",
  },
  {
    icon: "category",
    label: "Categorías",
    sub: "Administrar categorías",
    ruta: "/categorias",
  },
  {
    icon: "local-shipping",
    label: "Asistencia vial",
    sub: "Consultar grúas",
    ruta: "/asistencia",
  },
  {
    icon: "car-rental",
    label: "Vehículo sustituto",
    sub: "Consultar alquileres",
    ruta: "/vehiculos-alquiler",
  },
];

// Dashboard principal: resume ingresos, citas del dia y accesos rapidos.
export default function DashboardScreen() {
  const { colors: Colors, styles } = useThemedStyles(createStyles);
  const router = useRouter();

  // Estados principales que se actualizan cada vez que la pantalla toma foco.
  const [citas, setCitas] = useState<Cita[]>([]);
  const [ingresos, setIngresos] = useState<IngresosDashboard>({
    hoy: 0,
    ayer: 0,
    mes: 0,
    mesAnterior: 0,
  });
  const [cargando, setCargando] = useState(true);

  // Fecha actual usada para el saludo, el filtro de citas y los calculos.
  const hoy = new Date();
  const diasSemana = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  const meses = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];
  const fechaStr = `${diasSemana[hoy.getDay()]}, ${hoy.getDate()} de ${meses[hoy.getMonth()]} · ${hoy.getFullYear()}`;
  const hora = hoy.getHours();
  const saludo =
    hora < 12
      ? "Buenos días,"
      : hora < 18
        ? "Buenas tardes,"
        : "Buenas noches,";

  const formatFechaKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  // Normaliza la fecha del pago para poder compararla sin depender del formato.
  const getPagoDate = (pago: PagoDashboard) => {
    const rawDate = pago.fecha_pago ?? pago.fecha ?? "";
    const [year, month, day] = rawDate.substring(0, 10).split("-").map(Number);
    if (year && month && day) return new Date(year, month - 1, day);
    return new Date(rawDate);
  };

  const mismoMes = (date: Date, reference: Date) =>
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth();

  // Suma los pagos reales de la base de datos para hoy, ayer y el mes.
  const calcularIngresos = (pagos: PagoDashboard[]) => {
    const fechaHoy = formatFechaKey(hoy);
    const ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);
    const fechaAyer = formatFechaKey(ayer);
    const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);

    return pagos.reduce<IngresosDashboard>(
      (acc, pago) => {
        const fechaPago = getPagoDate(pago);
        if (Number.isNaN(fechaPago.getTime())) return acc;

        const fechaPagoKey = formatFechaKey(fechaPago);
        const monto = Number(pago.monto) || 0;
        if (fechaPagoKey === fechaHoy) acc.hoy += monto;
        if (fechaPagoKey === fechaAyer) acc.ayer += monto;
        if (mismoMes(fechaPago, hoy)) acc.mes += monto;
        if (mismoMes(fechaPago, mesAnterior)) acc.mesAnterior += monto;

        return acc;
      },
      { hoy: 0, ayer: 0, mes: 0, mesAnterior: 0 },
    );
  };

  const formatMonto = (value: number) => {
    if (value >= 1000000) return `\u20a1${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `\u20a1${Math.round(value / 1000)}K`;
    return `\u20a1${value.toLocaleString("es-CR")}`;
  };

  // Convierte la diferencia entre periodos en un texto corto para la tarjeta.
  const formatComparacion = (
    actual: number,
    anterior: number,
    label: string,
  ) => {
    if (anterior <= 0) return actual > 0 ? `+100% ${label}` : `0% ${label}`;
    const diff = Math.round(((actual - anterior) / anterior) * 100);
    return `${diff >= 0 ? "+" : ""}${diff}% ${label}`;
  };

  // Consulta citas pendientes de hoy y pagos para pintar el resumen principal.
  async function cargarDashboard() {
    try {
      setCargando(true);

      const fechaHoy = formatFechaKey(hoy);
      const [citasData, pagosData] = await Promise.all([
        citasService.getAll("", "PENDIENTE", fechaHoy),
        pagosService.getAll(),
      ]);

      setCitas(citasData);
      setIngresos(calcularIngresos(Array.isArray(pagosData) ? pagosData : []));
    } catch {
      setCitas([]);
      setIngresos({ hoy: 0, ayer: 0, mes: 0, mesAnterior: 0 });
    } finally {
      setCargando(false);
    }
  };

  // Cada vez que el usuario vuelve al dashboard se recargan los datos.
  useFocusEffect(
    useCallback(() => {
      void cargarDashboard();
    }, []),
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Saludo */}
        <View style={styles.saludoSection}>
          <Text style={styles.saludo}>{saludo}</Text>
          <Text style={styles.nombreUsuario}>Pedro Navarro</Text>
          <Text style={styles.fecha}>{fechaStr}</Text>
        </View>

        {/* Ingresos */}
        <Text style={styles.sectionLabel}>INGRESOS</Text>
        <View style={styles.ingresosRow}>
          <View style={styles.ingresoCard}>
            <Text style={styles.ingresoSub}>HOY</Text>
            <Text style={styles.ingresoMonto}>{formatMonto(ingresos.hoy)}</Text>
            <Text style={styles.ingresoComp}>
              {formatComparacion(ingresos.hoy, ingresos.ayer, "vs ayer")}
            </Text>
          </View>
          <View style={styles.ingresoCard}>
            <Text style={styles.ingresoSub}>ESTE MES</Text>
            <Text style={styles.ingresoMonto}>{formatMonto(ingresos.mes)}</Text>
            <Text style={styles.ingresoComp}>
              {formatComparacion(
                ingresos.mes,
                ingresos.mesAnterior,
                "vs anterior",
              )}
            </Text>
          </View>
        </View>

        {/* Citas de hoy */}
        <View style={styles.citasHeader}>
          <Text style={styles.sectionLabel}>CITAS DE HOY</Text>
          <Text style={styles.citasCount}>{citas.length} citas</Text>
        </View>

        {cargando ? (
          <ActivityIndicator
            color={Colors.primary}
            style={{ marginTop: sp(20) }}
          />
        ) : citas.length === 0 ? (
          <Text style={styles.citasVacias}>
            No hay citas pendientes para hoy
          </Text>
        ) : (
          citas.map((cita) => (
            <TouchableOpacity
              key={cita.id_cita}
              style={styles.citaCard}
              onPress={() =>
                router.push({
                  pathname: "/citas/editar",
                  params: { id: cita.id_cita },
                } as any)
              }
            >
              <View style={styles.citaHoraBadge}>
                <Text style={styles.citaHora}>
                  {cita.hora ? cita.hora.substring(0, 5) : "--"}
                </Text>
              </View>
              <View style={styles.citaInfo}>
                <Text style={styles.citaVehiculo}>
                  {cita.marca_vehiculo} {cita.modelo_vehiculo}
                  {cita.anio_vehiculo ? ` ${cita.anio_vehiculo}` : ""}
                </Text>
                <Text style={styles.citaServicio}>{cita.servicio}</Text>
                <Text style={styles.citaMeta}>{cita.cliente}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Accesos rápidos */}
        <Text style={[styles.sectionLabel, { marginTop: sp(8) }]}>
          ACCESOS RÁPIDOS
        </Text>
        <View style={styles.accesosGrid}>
          {ACCESOS.map((a, i) => (
            <TouchableOpacity
              key={i}
              style={styles.accesoCard}
              onPress={() => router.push(a.ruta as any)}
            >
              <View style={styles.accesoIconBox}>
                <MaterialIcons
                  name={a.icon as any}
                  size={22}
                  color={Colors.gray}
                />
              </View>
              <View>
                <Text style={styles.accesoLabel}>{a.label}</Text>
                <Text style={styles.accesoSub}>{a.sub}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.footer}>© 2026 RETRO GARAGE</Text>
      </ScrollView>
    </View>
  );
}

// Estilos visuales del dashboard principal.
const createStyles = (Colors: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  scroll: { flex: 1, paddingHorizontal: sp(20), paddingTop: sp(20) },
  saludoSection: {
    backgroundColor: Colors.primary,
    marginHorizontal: -sp(20),
    paddingHorizontal: sp(20),
    paddingVertical: sp(20),
    marginTop: -sp(20),
    paddingTop: sp(30),
    marginBottom: sp(4),
  },
  saludo: { color: Colors.infoSoft, fontSize: fs(13), marginBottom: sp(4) },
  nombreUsuario: {
    color: Colors.white,
    fontSize: fs(24),
    fontWeight: "700",
    marginBottom: sp(4),
  },
  fecha: { color: Colors.infoSoft, fontSize: fs(12) },
  sectionLabel: {
    fontSize: fs(11),
    fontWeight: "600",
    color: Colors.gray,
    letterSpacing: 1.5,
    marginTop: sp(20),
    marginBottom: sp(12),
  },
  ingresosRow: { flexDirection: "row", gap: sp(12) },
  ingresoCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: sp(14),
    padding: sp(16),
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
  },
  ingresoSub: {
    fontSize: fs(10),
    fontWeight: "600",
    color: Colors.gray,
    letterSpacing: 1,
    marginBottom: sp(6),
  },
  ingresoMonto: {
    fontSize: fs(26),
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: sp(4),
  },
  ingresoComp: { fontSize: fs(11), color: Colors.success },
  citasHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: sp(20),
    marginBottom: sp(12),
  },
  citasCount: { fontSize: fs(12), color: Colors.gray },
  citasVacias: {
    textAlign: "center",
    color: Colors.gray,
    fontSize: fs(13),
    marginVertical: sp(20),
  },
  citaCard: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderRadius: sp(14),
    padding: sp(14),
    marginBottom: sp(8),
    borderWidth: 1,
    borderColor: Colors.border,
    gap: sp(14),
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  citaHoraBadge: {
    backgroundColor: Colors.primary,
    borderRadius: sp(8),
    width: sp(52),
    height: sp(52),
    justifyContent: "center",
    alignItems: "center",
  },
  citaHora: { color: Colors.white, fontSize: fs(13), fontWeight: "700" },
  citaInfo: { flex: 1, justifyContent: "center" },
  citaVehiculo: {
    fontSize: fs(15),
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: sp(2),
  },
  citaServicio: { fontSize: fs(13), color: Colors.gray, marginBottom: sp(2) },
  citaMeta: { fontSize: fs(11), color: Colors.gray },
  accesosGrid: { flexDirection: "row", flexWrap: "wrap", gap: sp(12) },
  accesoCard: {
    width: screen.isTablet ? "23%" : "47%",
    backgroundColor: Colors.white,
    borderRadius: sp(14),
    padding: sp(14),
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: sp(12),
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  accesoIconBox: {
    width: sp(40),
    height: sp(40),
    borderRadius: sp(8),
    backgroundColor: Colors.cream,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  accesoLabel: { fontSize: fs(13), fontWeight: "600", color: Colors.primary },
  accesoSub: { fontSize: fs(11), color: Colors.gray, marginTop: sp(2) },
  footer: {
    textAlign: "center",
    fontSize: fs(11),
    color: Colors.gray,
    marginTop: sp(24),
    marginBottom: sp(32),
  },
});
