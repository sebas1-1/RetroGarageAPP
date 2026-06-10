import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Button, Card, Dialog, Input, Text } from "@rneui/themed";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  View,
} from "react-native";

import { Colors } from "../../constants/colors";
import { fs, sp } from "../../constants/responsive";
import { Cliente, clientesService } from "../../services/clientesService";

export default function ClientesScreen() {
  const router = useRouter();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);

  const [busqueda, setBusqueda] = useState("");

  const [clienteAEliminar, setClienteAEliminar] = useState<number | null>(null);
  const [eliminando, setEliminando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      cargarClientes();
    }, []),
  );

  const cargarClientes = async (texto = "") => {
    try {
      setCargando(true);

      const data = await clientesService.getAll(texto);

      setClientes(data);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setCargando(false);
    }
  };

  const eliminarCliente = async () => {
    if (clienteAEliminar === null) return;

    try {
      setEliminando(true);

      await clientesService.eliminar(clienteAEliminar);

      setClienteAEliminar(null);

      Alert.alert("Éxito", "Cliente eliminado correctamente");

      await cargarClientes(busqueda);
    } catch (e: any) {
      Alert.alert("Error", e.message || "No se pudo eliminar el cliente");
    } finally {
      setEliminando(false);
    }
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
      <Text style={styles.title}>Clientes</Text>

      <Button
        title="NUEVO CLIENTE"
        icon={<MaterialIcons name="person-add" size={22} color="white" />}
        buttonStyle={styles.btnNuevo}
        onPress={() => router.push("/clientes/nuevo")}
      />

      <Input
        placeholder="Buscar cliente..."
        value={busqueda}
        onChangeText={setBusqueda}
        containerStyle={styles.searchContainer}
        inputContainerStyle={styles.searchInput}
        onSubmitEditing={() => cargarClientes(busqueda)}
      />

      <Button
        icon={<MaterialIcons name="search" size={22} color="white" />}
        buttonStyle={styles.btnBuscar}
        onPress={() => cargarClientes(busqueda)}
      />

      <FlatList
        data={clientes}
        keyExtractor={(item) => item.id_cliente.toString()}
        contentContainerStyle={{
          paddingBottom: 20,
        }}
        renderItem={({ item }) => (
          <Card containerStyle={styles.card}>
            <Text style={styles.nombre}>
              {item.nombre} {item.apellido}
            </Text>

            <Text style={styles.info}>
              Identificación: {item.identificacion}
            </Text>

            <Text style={styles.info}>
              Fecha de nacimiento:{" "}
              {item.fecha_nacimiento
                ? item.fecha_nacimiento.split("T")[0]
                : "No registrada"}
            </Text>

            <Text style={styles.info}>Teléfono: {item.telefono}</Text>

            <Text style={styles.info}>
              Correo: {item.correo || "No registrado"}
            </Text>

            <Text style={styles.info}>
              Provincia: {item.provincia || "No registrada"}
            </Text>

            <Text style={styles.info}>
              Cantón: {item.canton || "No registrado"}
            </Text>

            <Text style={styles.info}>
              Notas: {item.notas || "Sin observaciones"}
            </Text>

            <View style={styles.botones}>
              <Button
                icon={<MaterialIcons name="edit" size={22} color="white" />}
                buttonStyle={styles.btnEditar}
                containerStyle={styles.iconButton}
                onPress={() =>
                  router.push(`/clientes/editar?id=${item.id_cliente}`)
                }
              />

              <Button
                icon={<MaterialIcons name="delete" size={22} color="white" />}
                buttonStyle={styles.btnEliminar}
                containerStyle={styles.iconButton}
                onPress={() => setClienteAEliminar(item.id_cliente)}
              />
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No hay clientes registrados</Text>
        }
      />

      <Dialog
        isVisible={clienteAEliminar !== null}
        onBackdropPress={() => setClienteAEliminar(null)}
      >
        <Dialog.Title title="Eliminar cliente" />

        <Text style={{ marginBottom: 20 }}>
          ¿Está seguro de que desea eliminar este cliente?
        </Text>

        <Dialog.Actions>
          <Dialog.Button
            title="CANCELAR"
            onPress={() => setClienteAEliminar(null)}
          />

          <Dialog.Button
            title={eliminando ? "ELIMINANDO..." : "ELIMINAR"}
            onPress={eliminarCliente}
            disabled={eliminando}
          />
        </Dialog.Actions>
      </Dialog>
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
    marginBottom: sp(12),
  },
  searchContainer: { paddingHorizontal: 0 },
  searchInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: sp(8),
    paddingHorizontal: sp(10),
    backgroundColor: Colors.white,
  },
  card: { borderRadius: sp(10), marginBottom: sp(12) },
  nombre: {
    fontSize: fs(18),
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: sp(10),
  },
  info: { marginBottom: sp(4), color: "#444", fontSize: fs(13) },
  botones: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: sp(16),
    gap: sp(10),
  },
  empty: {
    textAlign: "center",
    marginTop: sp(40),
    color: Colors.gray,
    fontSize: fs(14),
  },
  iconButton: { width: sp(50) },
  btnBuscar: {
    backgroundColor: Colors.primary,
    borderRadius: sp(25),
    width: sp(50),
    height: sp(50),
  },
  btnEditar: {
    backgroundColor: "#1976D2",
    borderRadius: sp(25),
    width: sp(50),
    height: sp(50),
  },
  btnEliminar: {
    backgroundColor: "#C62828",
    borderRadius: sp(25),
    width: sp(50),
    height: sp(50),
  },
});
