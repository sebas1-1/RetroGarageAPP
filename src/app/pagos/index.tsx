import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Text } from "@rneui/themed";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { MessageDialog } from "../../components/shared/MessageDialog";
import { Colors } from "../../constants/colors";
import { fs, sp } from "../../constants/responsive";
import { pagosService } from "../../services/pagosService";

interface Pago {
  id_pago: number;
  numero_factura: string;
  fecha: string;
  monto: number;
  metodo_pago: string;
  cliente: string | null;
  servicio: string | null;
  tipo: "cita" | "directo";
}

// Pantalla de pagos: muestra el historial de cobros registrados.
export default function PagosScreen() {
  const router = useRouter();
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [cargando, setCargando] = useState(true);
  const [messageDialog, setMessageDialog] = useState<{
    title: string;
    message: string;
  } | null>(null);

  // Recarga pagos cada vez que se vuelve a esta pantalla.
  useFocusEffect(
    useCallback(() => {
      cargarPagos();
    }, []),
  );

  // Consulta todos los pagos y controla errores de carga.
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

  const iconoMetodo = (metodo: string) => {
    if (metodo === "Efectivo") return "attach-money";
    if (metodo === "Tarjeta") return "credit-card";
    return "account-balance";
  };

  if (cargando) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RETRO GARAGE</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.title}>Pagos</Text>
          <TouchableOpacity
            style={styles.btnNuevo}
            onPress={() => router.push("/pagos/nuevo")}
          >
            <MaterialIcons name="add" size={20} color={Colors.cream} />
            <Text style={styles.btnNuevoText}>Nuevo pago</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={pagos}
          keyExtractor={(item) => item.id_pago.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: sp(32) }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/pagos/${item.id_pago}` as any)}
              activeOpacity={0.7}
            >
              {/* Fila superior: factura + monto */}
              <View style={styles.cardTopRow}>
                <View style={styles.facturaRow}>
                  <MaterialIcons name="receipt" size={16} color={Colors.gray} />
                  <Text style={styles.factura}>{item.numero_factura}</Text>
                </View>
                <Text style={styles.monto}>₡{item.monto.toLocaleString()}</Text>
              </View>

              <View style={styles.divider} />

              {/* Cliente y servicio */}
              {item.cliente && (
                <View style={styles.infoRow}>
                  <MaterialIcons name="person" size={14} color={Colors.gray} />
                  <Text style={styles.infoText}>{item.cliente}</Text>
                </View>
              )}
              {item.servicio && (
                <View style={styles.infoRow}>
                  <MaterialIcons name="build" size={14} color={Colors.gray} />
                  <Text style={styles.infoText}>{item.servicio}</Text>
                </View>
              )}

              {/* Fila inferior: método + fecha + tipo */}
              <View style={styles.cardBottomRow}>
                <View style={styles.metodoChip}>
                  <MaterialIcons
                    name={iconoMetodo(item.metodo_pago)}
                    size={13}
                    color={Colors.primary}
                  />
                  <Text style={styles.metodoText}>{item.metodo_pago}</Text>
                </View>

                <View style={styles.rightBadges}>
                  <View
                    style={[
                      styles.tipoBadge,
                      item.tipo === "cita"
                        ? styles.tipoCita
                        : styles.tipoDirecto,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tipoBadgeText,
                        item.tipo === "cita"
                          ? styles.tipoCitaText
                          : styles.tipoDirectoText,
                      ]}
                    >
                      {item.tipo === "cita" ? "Cita" : "Directo"}
                    </Text>
                  </View>
                  <Text style={styles.fecha}>
                    {new Date(item.fecha).toLocaleDateString("es-CR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <MaterialIcons
                name="receipt-long"
                size={48}
                color={Colors.border}
              />
              <Text style={styles.emptyText}>No hay pagos registrados</Text>
            </View>
          }
        />
      </View>

      <MessageDialog
        visible={messageDialog !== null}
        title={messageDialog?.title ?? ""}
        message={messageDialog?.message ?? ""}
        onClose={() => setMessageDialog(null)}
      />
    </View>
  );
}

// Estilos visuales del historial de pagos.
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: sp(16),
    paddingVertical: sp(14),
    paddingTop: sp(48),
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: fs(14),
    fontWeight: "600",
    letterSpacing: 2,
  },

  content: { flex: 1, paddingHorizontal: sp(20), paddingTop: sp(20) },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: sp(20),
  },
  title: {
    fontSize: fs(22),
    fontWeight: "600",
    color: Colors.primary,
  },
  btnNuevo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    borderRadius: sp(8),
    paddingHorizontal: sp(14),
    paddingVertical: sp(8),
    gap: sp(6),
  },
  btnNuevoText: {
    color: Colors.cream,
    fontSize: fs(13),
    fontWeight: "600",
  },

  card: {
    backgroundColor: Colors.white,
    borderRadius: sp(10),
    borderWidth: 1,
    borderColor: Colors.border,
    padding: sp(14),
    marginBottom: sp(12),
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: sp(10),
  },
  facturaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: sp(6),
  },
  factura: {
    fontSize: fs(13),
    fontWeight: "600",
    color: Colors.gray,
    letterSpacing: 0.5,
  },
  monto: {
    fontSize: fs(18),
    fontWeight: "700",
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: sp(10),
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: sp(6),
    marginBottom: sp(4),
  },
  infoText: {
    fontSize: fs(13),
    color: Colors.primary,
    fontWeight: "500",
  },
  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: sp(10),
  },
  metodoChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: sp(4),
    backgroundColor: Colors.cream,
    borderRadius: sp(6),
    paddingHorizontal: sp(8),
    paddingVertical: sp(4),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metodoText: {
    fontSize: fs(11),
    color: Colors.primary,
    fontWeight: "500",
  },
  rightBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: sp(8),
  },
  tipoBadge: {
    borderRadius: sp(6),
    paddingHorizontal: sp(8),
    paddingVertical: sp(3),
  },
  tipoCita: { backgroundColor: "#E1F5EE" },
  tipoDirecto: { backgroundColor: "#FAEEDA" },
  tipoBadgeText: { fontSize: fs(11), fontWeight: "600" },
  tipoCitaText: { color: "#0F6E56" },
  tipoDirectoText: { color: "#854F0B" },
  fecha: {
    fontSize: fs(11),
    color: Colors.gray,
  },

  emptyBox: {
    alignItems: "center",
    marginTop: sp(60),
    gap: sp(12),
  },
  emptyText: {
    fontSize: fs(14),
    color: Colors.gray,
    textAlign: "center",
  },
});
