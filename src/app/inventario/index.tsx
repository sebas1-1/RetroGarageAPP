import { Text } from "@rneui/themed";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { MessageDialog } from "../../components/shared/MessageDialog";
import { Colors } from "../../constants/colors";
import { fs, sp } from "../../constants/responsive";
import {
  EstadoStock,
  Producto,
  getEstadoStock,
  inventarioService,
} from "../../services/inventarioService";

const FILTROS = ["TODOS", "REPUESTOS", "HERRAMIENTAS", "INSUMOS"];

export default function InventarioScreen() {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [filtro, setFiltro] = useState("TODOS");
  const [messageDialog, setMessageDialog] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const cargar = useCallback(async (esRefresh = false) => {
    try {
      esRefresh ? setRefrescando(true) : setCargando(true);
      const data = await inventarioService.getAll();
      setProductos(data);
    } catch (e: any) {
      setMessageDialog({ title: "Error", message: e.message });
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const productosFiltrados = productos.filter((p) => {
    if (filtro === "TODOS") return true;
    return (
      p.categoria_nombre?.toUpperCase().includes(filtro.slice(0, -1)) ?? false
    );
  });

  const totalItems = productos.length;
  const stockBajo = productos.filter(
    (p) => getEstadoStock(p) === "STOCK BAJO",
  ).length;
  const agotados = productos.filter(
    (p) => getEstadoStock(p) === "AGOTADO",
  ).length;

  const colorEstado = (estado: EstadoStock) => {
    if (estado === "AGOTADO") return "#C62828";
    if (estado === "STOCK BAJO") return "#E65100";
    return "#2E7D32";
  };

  const bgEstado = (estado: EstadoStock) => {
    if (estado === "AGOTADO") return "#FFEBEE";
    if (estado === "STOCK BAJO") return "#FFF3E0";
    return "#E8F5E9";
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RETRO GARAGE</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => cargar(true)}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Título */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Gestión de stock</Text>
          <Text style={styles.subtitle}>Control de productos e inventario</Text>
        </View>

        <View style={styles.divider} />

        {/* Tarjetas resumen */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalItems}</Text>
            <Text style={styles.statLabel}>TOTAL ÍTEMS</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: "#E65100" }]}>
              {stockBajo}
            </Text>
            <Text style={styles.statLabel}>STOCK BAJO</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: "#C62828" }]}>
              {agotados}
            </Text>
            <Text style={styles.statLabel}>AGOTADOS</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Barra de acciones */}
        <View style={styles.actionsRow}>
          <Text style={styles.countText}>
            {productosFiltrados.length} ÍTEMS
          </Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push("/inventario/nuevo")}
          >
            <Text style={styles.addBtnText}>+ AGREGAR</Text>
          </TouchableOpacity>
        </View>

        {/* Filtros */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtrosScroll}
          contentContainerStyle={styles.filtrosContainer}
        >
          {FILTROS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filtroBtn, filtro === f && styles.filtroBtnActive]}
              onPress={() => setFiltro(f)}
            >
              <Text
                style={[
                  styles.filtroBtnText,
                  filtro === f && styles.filtroBtnTextActive,
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Lista */}
        {cargando ? (
          <ActivityIndicator
            color={Colors.primary}
            style={{ marginTop: sp(40) }}
          />
        ) : (
          <View style={styles.lista}>
            {productosFiltrados.map((producto) => {
              const estado = getEstadoStock(producto);
              return (
                <TouchableOpacity
                  key={producto.id_producto}
                  style={styles.card}
                  onPress={() =>
                    router.push(`/inventario/editar?id=${producto.id_producto}`)
                  }
                >
                  <View style={styles.cardLeft}>
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: colorEstado(estado) },
                      ]}
                    />
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardNombre}>{producto.nombre}</Text>
                      <Text style={styles.cardSub}>
                        {producto.categoria_nombre ?? "—"} ·{" "}
                        {producto.proveedor ?? "Sin proveedor"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardRight}>
                    <Text style={styles.cardStock}>
                      {producto.stock_actual}
                    </Text>
                    <Text style={styles.cardUnidad}>
                      {producto.unidad_medida.toLowerCase()}
                    </Text>
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: bgEstado(estado) },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          { color: colorEstado(estado) },
                        ]}
                      >
                        {estado}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <Text style={styles.footer}>© 2026 RETRO GARAGE</Text>
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
  menuIcon: { color: Colors.cream, fontSize: fs(20) },
  headerTitle: {
    color: Colors.cream,
    fontSize: fs(14),
    fontWeight: "600",
    letterSpacing: 2,
  },
  scroll: { flex: 1, paddingHorizontal: sp(20) },
  titleSection: { paddingVertical: sp(20) },
  title: { fontSize: fs(22), fontWeight: "600", color: Colors.primary },
  subtitle: { fontSize: fs(13), color: Colors.gray, marginTop: sp(4) },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: sp(4),
  },
  statsRow: {
    flexDirection: "row",
    gap: sp(10),
    paddingVertical: sp(16),
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: sp(8),
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: sp(14),
    alignItems: "center",
  },
  statNumber: {
    fontSize: fs(26),
    fontWeight: "600",
    color: Colors.primary,
  },
  statLabel: {
    fontSize: fs(10),
    color: Colors.gray,
    letterSpacing: 0.8,
    marginTop: sp(2),
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: sp(14),
  },
  countText: {
    fontSize: fs(12),
    color: Colors.gray,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: sp(16),
    paddingVertical: sp(8),
    borderRadius: sp(6),
  },
  addBtnText: {
    color: Colors.cream,
    fontSize: fs(13),
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  filtrosScroll: { marginBottom: sp(12) },
  filtrosContainer: { gap: sp(8), paddingBottom: sp(4) },
  filtroBtn: {
    paddingHorizontal: sp(14),
    paddingVertical: sp(7),
    borderRadius: sp(20),
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  filtroBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filtroBtnText: {
    fontSize: fs(12),
    color: Colors.primary,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  filtroBtnTextActive: { color: Colors.cream },
  lista: { gap: sp(10), paddingBottom: sp(8) },
  card: {
    backgroundColor: Colors.white,
    borderRadius: sp(10),
    borderWidth: 1,
    borderColor: Colors.border,
    padding: sp(14),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: sp(10),
  },
  dot: { width: sp(10), height: sp(10), borderRadius: sp(5) },
  cardInfo: { flex: 1 },
  cardNombre: {
    fontSize: fs(14),
    fontWeight: "600",
    color: Colors.primary,
  },
  cardSub: {
    fontSize: fs(12),
    color: Colors.gray,
    marginTop: sp(2),
  },
  cardRight: { alignItems: "flex-end", gap: sp(2) },
  cardStock: {
    fontSize: fs(20),
    fontWeight: "600",
    color: Colors.primary,
  },
  cardUnidad: { fontSize: fs(11), color: Colors.gray },
  badge: {
    paddingHorizontal: sp(8),
    paddingVertical: sp(3),
    borderRadius: sp(4),
    marginTop: sp(2),
  },
  badgeText: { fontSize: fs(10), fontWeight: "600", letterSpacing: 0.5 },
  footer: {
    textAlign: "center",
    fontSize: fs(11),
    color: Colors.gray,
    marginVertical: sp(32),
  },
});
