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
import { Servicio, serviciosService } from "../../services/serviciosService";

export default function ServiciosScreen() {
  const router = useRouter();

  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [servicioAEliminar, setServicioAEliminar] = useState<number | null>(
    null,
  );
  const [eliminando, setEliminando] = useState(false);
  const [messageDialog, setMessageDialog] = useState<{
    title: string;
    message: string;
  } | null>(null);

  useFocusEffect(
    useCallback(() => {
      cargarServicios();
    }, []),
  );

  const cargarServicios = async (texto = "") => {
    try {
      setCargando(true);
      setServicios(await serviciosService.getAll(texto));
    } catch (e: any) {
      setMessageDialog({ title: "Error", message: e.message });
    } finally {
      setCargando(false);
    }
  };

  const eliminarServicio = async () => {
    if (servicioAEliminar === null) return;
    try {
      setEliminando(true);
      await serviciosService.eliminar(servicioAEliminar);
      setServicioAEliminar(null);
      setMessageDialog({
        title: "Éxito",
        message: "Servicio eliminado correctamente",
      });
      await cargarServicios(busqueda);
    } catch (e: any) {
      setMessageDialog({ title: "Error", message: e.message });
    } finally {
      setEliminando(false);
    }
  };

  if (cargando)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Servicios</Text>

      <TouchableOpacity
        style={styles.btnNuevo}
        onPress={() => router.push("/servicios/nuevo" as any)}
      >
        <MaterialIcons name="add" size={22} color="white" />
        <Text style={styles.btnNuevoText}>NUEVO SERVICIO</Text>
      </TouchableOpacity>

      <Input
        placeholder="Buscar servicio..."
        value={busqueda}
        onChangeText={setBusqueda}
        onSubmitEditing={() => cargarServicios(busqueda)}
        containerStyle={{ paddingHorizontal: 0 }}
        inputContainerStyle={styles.searchInput}
      />

      <FlatList
        data={servicios}
        keyExtractor={(item) => item.id_servicio.toString()}
        contentContainerStyle={{ paddingBottom: sp(20) }}
        renderItem={({ item }) => (
          <Card containerStyle={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.categoriaBadge}>
                <Text style={styles.categoriaText}>{item.categoria}</Text>
              </View>
            </View>
            <Text style={styles.nombre}>{item.nombre}</Text>
            <Text style={styles.precio}>
              ₡{Number(item.precio_base).toLocaleString()}
            </Text>
            <View style={styles.botones}>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: "#1976D2" }]}
                onPress={() =>
                  router.push({
                    pathname: "/servicios/editar",
                    params: { id: item.id_servicio },
                  } as any)
                }
              >
                <MaterialIcons name="edit" size={22} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: "#C62828" }]}
                onPress={() => setServicioAEliminar(item.id_servicio)}
              >
                <MaterialIcons name="delete" size={22} color="white" />
              </TouchableOpacity>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No hay servicios registrados</Text>
        }
      />

      <Dialog
        isVisible={servicioAEliminar !== null}
        onBackdropPress={() => setServicioAEliminar(null)}
      >
        <Dialog.Title title="Eliminar servicio" />
        <Text style={{ marginBottom: sp(20) }}>
          ¿Está seguro de que desea eliminar este servicio?
        </Text>
        <Dialog.Actions>
          <Dialog.Button
            title="CANCELAR"
            onPress={() => setServicioAEliminar(null)}
          />
          <Dialog.Button
            title={eliminando ? "ELIMINANDO..." : "ELIMINAR"}
            onPress={eliminarServicio}
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
  card: { borderRadius: sp(10), marginBottom: sp(8) },
  cardHeader: { flexDirection: "row", marginBottom: sp(8) },
  categoriaBadge: {
    backgroundColor: Colors.cream,
    borderRadius: sp(20),
    paddingHorizontal: sp(12),
    paddingVertical: sp(4),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoriaText: { fontSize: fs(11), color: Colors.gray, fontWeight: "600" },
  nombre: {
    fontSize: fs(16),
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: sp(4),
  },
  precio: {
    fontSize: fs(15),
    color: "#0F6E56",
    fontWeight: "600",
    marginBottom: sp(8),
  },
  botones: { flexDirection: "row", justifyContent: "flex-end", gap: sp(10) },
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
