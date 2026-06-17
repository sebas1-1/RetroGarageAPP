import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Card, Dialog, Input, Text } from "@rneui/themed";
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
import { Cita, citasService } from "../../services/citasService";

// Colores de texto segun el estado de la cita.
const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: "#854F0B",
  COMPLETADA: "#0F6E56",
  CANCELADA: "#993C1D",
};

// Fondos suaves para las etiquetas de estado.
const ESTADO_BG: Record<string, string> = {
  PENDIENTE: "#FEF3C7",
  COMPLETADA: "#D1FAE5",
  CANCELADA: "#FAECE7",
};

// Pantalla principal de citas: permite buscar, filtrar, editar y eliminar.
export default function CitasScreen() {
  const router = useRouter();

  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [citaAEliminar, setCitaAEliminar] = useState<number | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [messageDialog, setMessageDialog] = useState<{
    title: string;
    message: string;
  } | null>(null);

  // Al volver a la pantalla se actualiza la lista de citas.
  useFocusEffect(
    useCallback(() => {
      cargarCitas();
    }, []),
  );

  // Consulta citas segun texto de busqueda y estado seleccionado.
  const cargarCitas = async (texto = busqueda, estado = estadoFiltro) => {
    try {
      setCargando(true);
      setCitas(await citasService.getAll(texto, estado));
    } catch (e: any) {
      setMessageDialog({ title: "Error", message: e.message });
    } finally {
      setCargando(false);
    }
  };

  // Elimina la cita seleccionada despues de confirmar la accion.
  const eliminarCita = async () => {
    if (citaAEliminar === null) return;
    try {
      setEliminando(true);
      await citasService.eliminar(citaAEliminar);
      setCitaAEliminar(null);
      setMessageDialog({
        title: "Éxito",
        message: "Cita eliminada correctamente",
      });
      await cargarCitas();
    } catch (e: any) {
      setMessageDialog({ title: "Error", message: e.message });
    } finally {
      setEliminando(false);
    }
  };

  const filtrarEstado = (estado: string) => {
    const nuevo = estadoFiltro === estado ? "" : estado;
    setEstadoFiltro(nuevo);
    cargarCitas(busqueda, nuevo);
  };

  if (cargando)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Citas</Text>

      <TouchableOpacity
        style={styles.btnNuevo}
        onPress={() => router.push("/citas/nuevo" as any)}
      >
        <MaterialIcons name="event" size={22} color="white" />
        <Text style={styles.btnNuevoText}>NUEVA CITA</Text>
      </TouchableOpacity>

      {/* Búsqueda */}
      <Input
        placeholder="Buscar por cliente o vehículo..."
        value={busqueda}
        onChangeText={setBusqueda}
        onSubmitEditing={() => cargarCitas(busqueda)}
        containerStyle={{ paddingHorizontal: 0 }}
        inputContainerStyle={styles.searchInput}
      />

      {/* Filtros de estado */}
      <View style={styles.filtrosRow}>
        {["PENDIENTE", "COMPLETADA", "CANCELADA"].map((e) => (
          <TouchableOpacity
            key={e}
            style={[
              styles.filtroBtn,
              estadoFiltro === e && {
                backgroundColor: ESTADO_COLORS[e],
                borderColor: ESTADO_COLORS[e],
              },
            ]}
            onPress={() => filtrarEstado(e)}
          >
            <Text
              style={[
                styles.filtroBtnText,
                estadoFiltro === e && { color: "white" },
              ]}
            >
              {e}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={citas}
        keyExtractor={(item) => item.id_cita.toString()}
        contentContainerStyle={{ paddingBottom: sp(20) }}
        renderItem={({ item }) => (
          <Card containerStyle={styles.card}>
            {/* Estado badge */}
            <View style={styles.cardHeader}>
              <Text style={styles.vehiculo}>
                {item.marca_vehiculo} {item.modelo_vehiculo}
                {item.anio_vehiculo ? ` ${item.anio_vehiculo}` : ""}
              </Text>
              <View
                style={[
                  styles.estadoBadge,
                  { backgroundColor: ESTADO_BG[item.estado] },
                ]}
              >
                <Text
                  style={[
                    styles.estadoText,
                    { color: ESTADO_COLORS[item.estado] },
                  ]}
                >
                  {item.estado}
                </Text>
              </View>
            </View>

            <Text style={styles.info}>Cliente: {item.cliente}</Text>
            <Text style={styles.info}>Servicio: {item.servicio}</Text>
            <Text style={styles.info}>
              Fecha: {item.fecha ? item.fecha.split("T")[0] : ""} — {item.hora}
            </Text>
            {item.descripcion ? (
              <Text style={styles.info}>Nota: {item.descripcion}</Text>
            ) : null}

            <View style={styles.botones}>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: "#1976D2" }]}
                onPress={() =>
                  router.push({
                    pathname: "/citas/editar",
                    params: { id: item.id_cita },
                  } as any)
                }
              >
                <MaterialIcons name="edit" size={22} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: "#C62828" }]}
                onPress={() => setCitaAEliminar(item.id_cita)}
              >
                <MaterialIcons name="delete" size={22} color="white" />
              </TouchableOpacity>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No hay citas registradas</Text>
        }
      />

      <Dialog
        isVisible={citaAEliminar !== null}
        onBackdropPress={() => setCitaAEliminar(null)}
      >
        <Dialog.Title title="Eliminar cita" />
        <Text style={{ marginBottom: sp(20) }}>
          ¿Está seguro de que desea eliminar esta cita?
        </Text>
        <Dialog.Actions>
          <Dialog.Button
            title="CANCELAR"
            onPress={() => setCitaAEliminar(null)}
          />
          <Dialog.Button
            title={eliminando ? "ELIMINANDO..." : "ELIMINAR"}
            onPress={eliminarCita}
            disabled={eliminando}
          />
        </Dialog.Actions>
      </Dialog>

      <MessageDialog
        visible={messageDialog !== null}
        title={messageDialog?.title ?? ""}
        message={messageDialog?.message ?? ""}
        onClose={() => setMessageDialog(null)}
      />
    </View>
  );
}

// Estilos visuales del listado de citas.
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream, padding: sp(16) },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: {
    fontSize: fs(24),
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: sp(16),
  },
  btnNuevo: {
    backgroundColor: Colors.primary,
    borderRadius: sp(8),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: sp(8),
    paddingVertical: sp(12),
    marginBottom: sp(12),
  },
  btnNuevoText: {
    color: "white",
    fontWeight: "700",
    fontSize: fs(13),
    letterSpacing: 1,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: sp(8),
    paddingHorizontal: sp(10),
    backgroundColor: Colors.white,
  },
  filtrosRow: { flexDirection: "row", gap: sp(8), marginBottom: sp(12) },
  filtroBtn: {
    paddingHorizontal: sp(12),
    paddingVertical: sp(6),
    borderRadius: sp(20),
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  filtroBtnText: { fontSize: fs(11), fontWeight: "600", color: Colors.primary },
  card: { borderRadius: sp(10), marginBottom: sp(8), padding: sp(4) },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: sp(8),
  },
  vehiculo: {
    fontSize: fs(16),
    fontWeight: "700",
    color: Colors.primary,
    flex: 1,
  },
  estadoBadge: {
    paddingHorizontal: sp(10),
    paddingVertical: sp(4),
    borderRadius: sp(20),
    marginLeft: sp(8),
  },
  estadoText: { fontSize: fs(10), fontWeight: "700", letterSpacing: 0.5 },
  info: { fontSize: fs(13), color: "#444", marginBottom: sp(4) },
  botones: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: sp(12),
    gap: sp(10),
  },
  iconBtn: {
    width: sp(42),
    height: sp(42),
    borderRadius: sp(21),
    justifyContent: "center",
    alignItems: "center",
  },
  empty: {
    textAlign: "center",
    marginTop: sp(40),
    color: Colors.gray,
    fontSize: fs(14),
  },
});
