import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Text } from "@rneui/themed";
import { useFocusEffect } from "expo-router";
import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { MessageDialog } from "../../components/shared/MessageDialog";
import { Colors } from "../../constants/colors";
import { fs, screen, sp } from "../../constants/responsive";
import { pagosService } from "../../services/pagosService";

interface PagoEstadistica {
  id_pago: number;
  fecha?: string;
  fecha_pago?: string;
  monto: number;
  metodo_pago?: string;
  servicio?: string | null;
  tipo?: "cita" | "directo";
}

interface MetodoResumen {
  nombre: string;
  monto: number;
  porcentaje: number;
  color: string;
}

// Nombres cortos usados en la grafica de ingresos.
const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun"];
const METHOD_COLORS = [Colors.primary, Colors.accent, Colors.warning];

// Obtiene la fecha real del pago aunque venga como fecha_pago o fecha.
const getPagoDate = (pago: PagoEstadistica) =>
  new Date(pago.fecha_pago ?? pago.fecha ?? "");

// Formatea montos grandes para que entren mejor en las tarjetas.
const formatMoney = (value: number) => {
  if (value >= 1000000) return `\u20a1${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `\u20a1${Math.round(value / 1000)}K`;
  return `\u20a1${value.toLocaleString("es-CR")}`;
};

const sameMonth = (date: Date, reference: Date) =>
  date.getFullYear() === reference.getFullYear() &&
  date.getMonth() === reference.getMonth();

// Pantalla de analisis del negocio basada en los pagos registrados.
export default function EstadisticasScreen() {
  // Estados para los pagos, el loader y los mensajes de error.
  const [pagos, setPagos] = useState<PagoEstadistica[]>([]);
  const [cargando, setCargando] = useState(true);
  const [messageDialog, setMessageDialog] = useState<{
    title: string;
    message: string;
  } | null>(null);

  // Recarga las estadisticas cuando el usuario entra a esta pantalla.
  useFocusEffect(
    useCallback(() => {
      cargarPagos();
    }, []),
  );

  // Trae todos los pagos desde la API para calcular las metricas.
  const cargarPagos = async () => {
    try {
      setCargando(true);
      const data = await pagosService.getAll();
      setPagos(data);
    } catch (e: any) {
      setMessageDialog({ title: "Error", message: e.message });
    } finally {
      setCargando(false);
    }
  };

  // Agrupa los pagos por mes, metodo y tipo para evitar datos quemados.
  const stats = useMemo(() => {
    const now = new Date();
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    // Filtra pagos del mes actual y del mes anterior para comparar rendimiento.
    const currentPayments = pagos.filter((pago) =>
      sameMonth(getPagoDate(pago), now),
    );
    const previousPayments = pagos.filter((pago) =>
      sameMonth(getPagoDate(pago), previousMonth),
    );

    // Calcula ingresos totales y crecimiento contra el mes anterior.
    const currentTotal = currentPayments.reduce(
      (sum, pago) => sum + pago.monto,
      0,
    );
    const previousTotal = previousPayments.reduce(
      (sum, pago) => sum + pago.monto,
      0,
    );
    const growth =
      previousTotal > 0
        ? Math.round(((currentTotal - previousTotal) / previousTotal) * 100)
        : 0;

    // Prepara las barras de ingresos de los ultimos seis meses.
    const byMonth = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const total = pagos
        .filter((pago) => sameMonth(getPagoDate(pago), date))
        .reduce((sum, pago) => sum + pago.monto, 0);
      return { label: MONTHS[date.getMonth()], total };
    });

    const maxMonth = Math.max(...byMonth.map((month) => month.total), 1);
    // Agrupa el dinero por metodo de pago para mostrar su peso en el mes.
    const methodsMap = new Map<string, number>();
    currentPayments.forEach((pago) => {
      const method = pago.metodo_pago ?? "Sin metodo";
      methodsMap.set(method, (methodsMap.get(method) ?? 0) + pago.monto);
    });

    const methods: MetodoResumen[] = Array.from(methodsMap.entries())
      .map(([nombre, monto], index) => ({
        nombre,
        monto,
        porcentaje:
          currentTotal > 0 ? Math.round((monto / currentTotal) * 100) : 0,
        color: METHOD_COLORS[index % METHOD_COLORS.length],
      }))
      .sort((a, b) => b.monto - a.monto);

    // Promedio que deja cada pago registrado durante el mes actual.
    const ticket =
      currentPayments.length > 0
        ? Math.round(currentTotal / currentPayments.length)
        : 0;

    return {
      currentTotal,
      growth,
      paymentsCount: currentPayments.length,
      paidAppointments: currentPayments.filter((pago) => pago.tipo === "cita")
        .length,
      directPayments: currentPayments.filter((pago) => pago.tipo === "directo")
        .length,
      ticket,
      byMonth,
      maxMonth,
      methods,
    };
  }, [pagos]);

  if (cargando) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RETRO GARAGE</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>Estadisticas</Text>
            <Text style={styles.subtitle}>Rendimiento del negocio</Text>
          </View>
          <TouchableOpacity style={styles.periodButton} activeOpacity={0.75}>
            <Text style={styles.periodText}>Este mes</Text>
            <MaterialIcons
              name="expand-more"
              size={18}
              color={Colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Tarjetas superiores con los numeros principales del mes. */}
        <View style={styles.metricGrid}>
          <MetricCard
            label="INGRESOS"
            value={formatMoney(stats.currentTotal)}
            helper={`${stats.growth >= 0 ? "+" : ""}${stats.growth}% vs mes anterior`}
            positive={stats.growth >= 0}
          />
          <MetricCard
            label="PAGOS DEL MES"
            value={stats.paymentsCount.toString()}
            helper={`${stats.paidAppointments} ligados a cita`}
            positive
          />
          <MetricCard
            label="PAGOS DIRECTOS"
            value={stats.directPayments.toString()}
            helper="Registrados sin cita"
            positive={stats.directPayments > 0}
          />
          <MetricCard
            label="TICKET PROMEDIO"
            value={formatMoney(stats.ticket)}
            helper="Por pago registrado"
            positive
          />
        </View>

        {/* Grafico simple de barras para comparar ingresos por mes. */}
        <View style={styles.card}>
          <SectionTitle>INGRESOS POR MES</SectionTitle>
          <View style={styles.chart}>
            {stats.byMonth.map((item, index) => (
              <View key={`${item.label}-${index}`} style={styles.barItem}>
                <Text style={styles.barValue}>{formatMoney(item.total)}</Text>
                <View
                  style={[
                    styles.bar,
                    {
                      height:
                        item.total === 0
                          ? sp(2)
                          : Math.max(
                              sp(18),
                              (item.total / stats.maxMonth) * sp(80),
                            ),
                      backgroundColor:
                        index === stats.byMonth.length - 1
                          ? Colors.accent
                          : Colors.warning,
                    },
                  ]}
                />
                <Text style={styles.barLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Desglose de ingresos segun el metodo de pago usado. */}
        <View style={styles.card}>
          <SectionTitle>METODOS DE PAGO</SectionTitle>
          {stats.methods.length === 0 ? (
            <Text style={styles.emptyText}>
              No hay pagos registrados este mes
            </Text>
          ) : (
            stats.methods.map((method) => (
              <PaymentMethodRow key={method.nombre} method={method} />
            ))
          )}
        </View>

        {/* Resumen textual generado con los mismos datos de la pantalla. */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryBadge}>
            <MaterialIcons name="insights" size={11} color={Colors.warning} />
            <Text style={styles.summaryBadgeText}>RESUMEN</Text>
          </View>
          <Text style={styles.summaryTitle}>Resumen del mes</Text>
          <Insight>
            Los ingresos {stats.growth >= 0 ? "subieron" : "bajaron"}{" "}
            {Math.abs(stats.growth)}% respecto al mes anterior.
          </Insight>
          <Insight>
            El ticket promedio es de {formatMoney(stats.ticket)} por pago
            registrado.
          </Insight>
          <Insight>
            {stats.methods[0]
              ? `${stats.methods[0].nombre} concentra el ${stats.methods[0].porcentaje}% de los ingresos del mes.`
              : "Aun no hay metodos de pago para analizar este mes."}
          </Insight>
          <TouchableOpacity style={styles.analysisButton} activeOpacity={0.75}>
            <MaterialIcons name="refresh" size={14} color={Colors.accent} />
            <Text style={styles.analysisButtonText}>ACTUALIZAR RESUMEN</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>2026 RETRO GARAGE</Text>
      </ScrollView>

      <MessageDialog
        visible={messageDialog !== null}
        title={messageDialog?.title ?? ""}
        message={messageDialog?.message ?? ""}
        onClose={() => setMessageDialog(null)}
      />
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

// Tarjeta reutilizable para mostrar una metrica principal.
function MetricCard({
  label,
  value,
  helper,
  positive,
}: {
  label: string;
  value: string;
  helper: string;
  positive: boolean;
}) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text
        style={[
          styles.metricHelper,
          positive ? styles.positive : styles.negative,
        ]}
      >
        {helper}
      </Text>
    </View>
  );
}

// Fila usada para cada metodo de pago dentro del desglose.
function PaymentMethodRow({ method }: { method: MetodoResumen }) {
  return (
    <View style={styles.methodRow}>
      <View style={styles.methodLeft}>
        <View style={[styles.methodDot, { backgroundColor: method.color }]} />
        <Text style={styles.methodName}>{method.nombre}</Text>
      </View>
      <View style={styles.methodRight}>
        <Text style={styles.methodAmount}>{formatMoney(method.monto)}</Text>
        <Text style={styles.methodPercent}>{method.porcentaje}%</Text>
      </View>
    </View>
  );
}

// Item de texto para el resumen inferior.
function Insight({ children }: { children: ReactNode }) {
  return (
    <View style={styles.insightRow}>
      <Text style={styles.insightBullet}>*</Text>
      <Text style={styles.insightText}>{children}</Text>
    </View>
  );
}

// Estilos visuales de la pantalla de estadisticas.
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: sp(24),
    paddingTop: sp(18),
    height: sp(56),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: Colors.white,
    fontSize: fs(13),
    fontWeight: "600",
    letterSpacing: 4,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: sp(24),
    paddingTop: sp(28),
    paddingBottom: sp(44),
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: sp(22),
  },
  title: {
    color: Colors.primary,
    fontSize: fs(22),
    fontWeight: "600",
  },
  subtitle: {
    color: Colors.gray,
    fontSize: fs(13),
    marginTop: sp(2),
  },
  periodButton: {
    minWidth: sp(88),
    height: sp(32),
    borderRadius: sp(8),
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    paddingHorizontal: sp(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  periodText: {
    color: Colors.primary,
    fontSize: fs(12),
    fontWeight: "500",
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: sp(8),
    marginBottom: sp(20),
  },
  metricCard: {
    width: screen.isTablet ? "24%" : "48.7%",
    minHeight: sp(82),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: sp(8),
    padding: sp(14),
  },
  metricLabel: {
    color: Colors.accent,
    fontSize: fs(10),
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: sp(5),
  },
  metricValue: {
    color: Colors.primary,
    fontSize: fs(22),
    fontWeight: "500",
  },
  metricHelper: {
    fontSize: fs(10),
    marginTop: sp(4),
  },
  positive: { color: Colors.success },
  negative: { color: Colors.danger },
  card: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: sp(8),
    padding: sp(18),
    marginBottom: sp(12),
  },
  sectionTitle: {
    color: Colors.accent,
    fontSize: fs(11),
    fontWeight: "700",
    letterSpacing: 3,
    marginBottom: sp(18),
  },
  chart: {
    height: sp(118),
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  barItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  barValue: {
    color: Colors.gray,
    fontSize: fs(9),
    marginBottom: sp(4),
  },
  bar: {
    width: "78%",
    borderRadius: sp(3),
  },
  barLabel: {
    color: Colors.gray,
    fontSize: fs(10),
    marginTop: sp(6),
  },
  methodRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: sp(12),
    borderBottomWidth: 1,
    borderBottomColor: Colors.cream,
  },
  methodLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: sp(8),
  },
  methodDot: {
    width: sp(8),
    height: sp(8),
    borderRadius: sp(4),
  },
  methodName: {
    color: Colors.primary,
    fontSize: fs(12),
  },
  methodRight: {
    alignItems: "flex-end",
  },
  methodAmount: {
    color: Colors.primary,
    fontSize: fs(13),
    fontWeight: "600",
  },
  methodPercent: {
    color: Colors.gray,
    fontSize: fs(10),
  },
  summaryCard: {
    backgroundColor: Colors.primary,
    borderRadius: sp(8),
    padding: sp(18),
    marginTop: sp(2),
    marginBottom: sp(34),
  },
  summaryBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.white,
    borderRadius: sp(12),
    paddingHorizontal: sp(10),
    paddingVertical: sp(4),
    flexDirection: "row",
    alignItems: "center",
    gap: sp(4),
    marginBottom: sp(14),
  },
  summaryBadgeText: {
    color: Colors.warning,
    fontSize: fs(9),
    fontWeight: "700",
    letterSpacing: 2,
  },
  summaryTitle: {
    color: Colors.white,
    fontSize: fs(13),
    fontWeight: "600",
    marginBottom: sp(8),
  },
  insightRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: sp(7),
  },
  insightBullet: {
    color: Colors.warning,
    fontSize: fs(14),
    lineHeight: fs(18),
    marginRight: sp(7),
  },
  insightText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: fs(12),
    lineHeight: fs(18),
  },
  analysisButton: {
    height: sp(36),
    borderRadius: sp(8),
    borderWidth: 1,
    borderColor: Colors.warning,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: sp(8),
    marginTop: sp(14),
  },
  analysisButtonText: {
    color: Colors.accent,
    fontSize: fs(10),
    fontWeight: "700",
    letterSpacing: 2,
  },
  emptyText: {
    color: Colors.gray,
    fontSize: fs(12),
    textAlign: "center",
    paddingVertical: sp(8),
  },
  footer: {
    textAlign: "center",
    fontSize: fs(10),
    color: Colors.border,
    fontWeight: "700",
    letterSpacing: 3,
  },
});
