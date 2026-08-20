import { useThemedStyles } from "@/contexts/AccessibilityThemeContext";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Text } from "@rneui/themed";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { MessageDialog } from "../../components/shared/MessageDialog";
import type { AppColors } from "../../constants/colors";
import { fs, sp } from "../../constants/responsive";
import { pagosService } from "../../services/pagosService";

interface PagoDetalle {
  id_pago: number;
  numero_factura: string;
  id_cita: number | null;
  monto: number | string;
  metodo_pago: string;
  banco: string | null;
  numero_referencia: string | null;
  estado_pago: string;
  estado_pasarela?: string | null;
  fecha_pago: string;
  observaciones: string | null;
  marca_tarjeta?: string | null;
  ultimos_cuatro?: string | null;
  telefono_sinpe?: string | null;
  paypal_order_id?: string | null;
  moneda_externa?: string | null;
  monto_externo?: number | string | null;
  mensaje_pasarela?: string | null;
}

const formatearMonto = (value: unknown) => {
  const monto = Number(value);
  return Number.isFinite(monto) ? monto.toLocaleString("es-CR") : "No disponible";
};

const formatearFecha = (value: string | null | undefined) => {
  if (!value) return "No disponible";
  const fecha = new Date(value);
  if (Number.isNaN(fecha.getTime())) return "No disponible";
  return fecha.toLocaleString("es-CR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ocultarTelefono = (value: string | null | undefined) => {
  const digitos = value?.replace(/\D/g, "") ?? "";
  return digitos ? `•••• ${digitos.slice(-4)}` : "No disponible";
};

export default function PagoDetalleScreen() {
  const { colors: Colors, styles } = useThemedStyles(createStyles);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const idPago = Number(Array.isArray(id) ? id[0] : id);
  const idInvalido = !Number.isInteger(idPago) || idPago <= 0;
  const [pago, setPago] = useState<PagoDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (idInvalido) return;

    let activo = true;

    pagosService
      .getById(idPago)
      .then((data) => {
        if (activo) setPago(data);
      })
      .catch((reason: unknown) => {
        if (!activo) return;
        setError(
          reason instanceof Error
            ? reason.message
            : "No fue posible cargar el pago.",
        );
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [idInvalido, idPago]);

  if (idInvalido) {
    return (
      <View style={styles.centered}>
        <MaterialIcons name="error-outline" size={48} color={Colors.danger} />
        <Text style={styles.loadingText}>
          El identificador del pago no es válido.
        </Text>
        <TouchableOpacity style={styles.returnButton} onPress={() => router.back()}>
          <Text style={styles.returnButtonText}>Volver a pagos</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (cargando) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Cargando pago...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Volver al historial de pagos"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>DETALLE DEL PAGO</Text>
        <View style={styles.headerSpacer} />
      </View>

      {pago ? (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryCard}>
            <MaterialIcons
              name="verified"
              size={36}
              color={Colors.success}
            />
            <Text style={styles.invoice}>{pago.numero_factura}</Text>
            <Text style={styles.amount}>₡{formatearMonto(pago.monto)}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {pago.estado_pago || "COMPLETADO"}
              </Text>
            </View>
          </View>

          <View style={styles.detailCard}>
            <DetailRow label="Fecha" value={formatearFecha(pago.fecha_pago)} />
            <DetailRow label="Método" value={pago.metodo_pago || "No disponible"} />
            <DetailRow label="Banco" value={pago.banco || "No disponible"} />
            <DetailRow
              label="Tipo de cobro"
              value={pago.id_cita !== null ? `Cita #${pago.id_cita}` : "Directo"}
            />
            {pago.marca_tarjeta && (
              <DetailRow
                label="Tarjeta"
                value={`${pago.marca_tarjeta} •••• ${pago.ultimos_cuatro ?? ""}`.trim()}
              />
            )}
            {pago.telefono_sinpe && (
              <DetailRow
                label="SINPE Móvil"
                value={ocultarTelefono(pago.telefono_sinpe)}
              />
            )}
            {pago.moneda_externa && pago.monto_externo !== null && (
              <DetailRow
                label="Monto externo"
                value={`${pago.moneda_externa} ${Number(pago.monto_externo).toFixed(2)}`}
              />
            )}
            <DetailRow
              label="Referencia"
              value={pago.numero_referencia || "No disponible"}
              last={!pago.observaciones}
            />
            {pago.observaciones && (
              <DetailRow label="Observaciones" value={pago.observaciones} last />
            )}
          </View>

          <View style={styles.privacyNotice}>
            <MaterialIcons name="lock" size={18} color={Colors.info} />
            <Text style={styles.privacyText}>
              Por seguridad, nunca se muestran números completos de tarjeta,
              teléfono ni códigos CVV.
            </Text>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.centered}>
          <MaterialIcons name="receipt-long" size={48} color={Colors.gray} />
          <Text style={styles.loadingText}>No se encontró el pago.</Text>
          <TouchableOpacity style={styles.returnButton} onPress={() => router.back()}>
            <Text style={styles.returnButtonText}>Volver a pagos</Text>
          </TouchableOpacity>
        </View>
      )}

      <MessageDialog
        visible={error !== null}
        title="No se pudo abrir el pago"
        message={error ?? ""}
        onClose={() => {
          setError(null);
          router.back();
        }}
      />
    </View>
  );
}

function DetailRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  const { styles } = useThemedStyles(createStyles);

  return (
    <View style={[styles.detailRow, last && styles.detailRowLast]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const createStyles = (Colors: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.cream },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: sp(12),
      padding: sp(24),
      backgroundColor: Colors.cream,
    },
    loadingText: { color: Colors.gray, fontSize: fs(14), textAlign: "center" },
    header: {
      backgroundColor: Colors.primary,
      paddingTop: sp(48),
      paddingBottom: sp(14),
      paddingHorizontal: sp(18),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    backButton: { padding: sp(6) },
    headerTitle: {
      color: Colors.white,
      fontSize: fs(14),
      fontWeight: "700",
      letterSpacing: 1.5,
    },
    headerSpacer: { width: sp(36) },
    content: { padding: sp(20), paddingBottom: sp(40), gap: sp(16) },
    summaryCard: {
      alignItems: "center",
      backgroundColor: Colors.white,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: sp(14),
      padding: sp(22),
      gap: sp(7),
    },
    invoice: {
      color: Colors.gray,
      fontSize: fs(13),
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    amount: { color: Colors.primary, fontSize: fs(27), fontWeight: "800" },
    statusBadge: {
      backgroundColor: Colors.successSoft,
      borderRadius: sp(20),
      paddingHorizontal: sp(12),
      paddingVertical: sp(5),
    },
    statusText: { color: Colors.success, fontSize: fs(11), fontWeight: "800" },
    detailCard: {
      backgroundColor: Colors.white,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: sp(14),
      paddingHorizontal: sp(16),
    },
    detailRow: {
      paddingVertical: sp(14),
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      gap: sp(5),
    },
    detailRowLast: { borderBottomWidth: 0 },
    detailLabel: {
      color: Colors.gray,
      fontSize: fs(11),
      fontWeight: "700",
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    detailValue: { color: Colors.text, fontSize: fs(14), fontWeight: "600" },
    privacyNotice: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: sp(9),
      backgroundColor: Colors.infoSoft,
      borderRadius: sp(10),
      padding: sp(14),
    },
    privacyText: { flex: 1, color: Colors.info, fontSize: fs(12), lineHeight: fs(18) },
    returnButton: {
      backgroundColor: Colors.accent,
      borderRadius: sp(8),
      paddingHorizontal: sp(18),
      paddingVertical: sp(10),
    },
    returnButtonText: { color: Colors.white, fontSize: fs(13), fontWeight: "700" },
  });
