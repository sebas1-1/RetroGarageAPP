import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Text } from "@rneui/themed";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Colors } from "../constants/colors";
import { fs, screen, sp } from "../constants/responsive";

const CITAS_HOY = [
  {
    id: 1,
    hora: "9:00",
    periodo: "AM",
    vehiculo: "Ford Mustang 1968",
    servicio: "Restauración de motor",
    identificacion: "1-0123-4567",
    cliente: "Carlos Méndez",
  },
  {
    id: 2,
    hora: "11:30",
    periodo: "AM",
    vehiculo: "Chevrolet Bel Air 1957",
    servicio: "Pintura y carrocería",
    identificacion: "2-0987-6543",
    cliente: "Ana Rojas",
  },
  {
    id: 3,
    hora: "2:00",
    periodo: "PM",
    vehiculo: "Dodge Charger 1970",
    servicio: "Mantenimiento general",
    identificacion: "3-0321-1234",
    cliente: "Luis Vargas",
  },
];

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
];

export default function DashboardScreen() {
  const router = useRouter();

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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Saludo */}
        <View style={styles.saludoSection}>
          <Text style={styles.saludo}>{saludo}</Text>
          <Text style={styles.nombreUsuario}>José Rodríguez</Text>
          <Text style={styles.fecha}>{fechaStr}</Text>
        </View>

        {/* Ingresos */}
        <Text style={styles.sectionLabel}>INGRESOS</Text>
        <View style={styles.ingresosRow}>
          <View style={styles.ingresoCard}>
            <Text style={styles.ingresoSub}>HOY</Text>
            <Text style={styles.ingresoMonto}>₡320K</Text>
            <Text style={styles.ingresoComp}>↑ vs ayer</Text>
          </View>
          <View style={styles.ingresoCard}>
            <Text style={styles.ingresoSub}>ESTE MES</Text>
            <Text style={styles.ingresoMonto}>₡6.4M</Text>
            <Text style={styles.ingresoComp}>↑ 12% vs anterior</Text>
          </View>
        </View>

        {/* Citas de hoy */}
        <View style={styles.citasHeader}>
          <Text style={styles.sectionLabel}>CITAS DE HOY</Text>
          <Text style={styles.citasCount}>{CITAS_HOY.length} citas</Text>
        </View>

        {CITAS_HOY.map((cita) => (
          <View key={cita.id} style={styles.citaCard}>
            <View style={styles.citaHoraBadge}>
              <Text style={styles.citaHora}>{cita.hora}</Text>
              <Text style={styles.citaPeriodo}>{cita.periodo}</Text>
            </View>
            <View style={styles.citaInfo}>
              <Text style={styles.citaVehiculo}>{cita.vehiculo}</Text>
              <Text style={styles.citaServicio}>{cita.servicio}</Text>
              <Text style={styles.citaMeta}>
                ID: {cita.identificacion} · {cita.cliente}
              </Text>
            </View>
          </View>
        ))}

        {/* Accesos rápidos */}
        <Text style={[styles.sectionLabel, { marginTop: 8 }]}>
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

const styles = StyleSheet.create({
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
  saludo: { color: "#B8B4D4", fontSize: fs(13), marginBottom: sp(4) },
  nombreUsuario: {
    color: Colors.cream,
    fontSize: fs(24),
    fontWeight: "700",
    marginBottom: sp(4),
  },
  fecha: { color: "#B8B4D4", fontSize: fs(12) },
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
    borderRadius: sp(10),
    padding: sp(16),
    borderWidth: 1,
    borderColor: Colors.border,
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
  ingresoComp: { fontSize: fs(11), color: "#0F6E56" },
  citasHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: sp(20),
    marginBottom: sp(12),
  },
  citasCount: { fontSize: fs(12), color: Colors.gray },
  citaCard: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderRadius: sp(10),
    padding: sp(14),
    marginBottom: sp(8),
    borderWidth: 1,
    borderColor: Colors.border,
    gap: sp(14),
  },
  citaHoraBadge: {
    backgroundColor: Colors.primary,
    borderRadius: sp(8),
    width: sp(52),
    height: sp(52),
    justifyContent: "center",
    alignItems: "center",
  },
  citaHora: { color: Colors.cream, fontSize: fs(15), fontWeight: "700" },
  citaPeriodo: { color: "#B8B4D4", fontSize: fs(10) },
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
    borderRadius: sp(10),
    padding: sp(14),
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: sp(12),
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
