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
import { Usuario, usuariosService } from "../../services/usuariosService";

export default function UsuariosScreen() {
  const router = useRouter();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<number | null>(null);
  const [eliminando, setEliminando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      cargarUsuarios();
    }, []),
  );

  const cargarUsuarios = async (texto = "") => {
    try {
      setCargando(true);
      setUsuarios(await usuariosService.getAll(texto));
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setCargando(false);
    }
  };

  const eliminarUsuario = async () => {
    if (usuarioAEliminar === null) return;
    try {
      setEliminando(true);
      await usuariosService.eliminar(usuarioAEliminar);
      setUsuarioAEliminar(null);
      Alert.alert("Éxito", "Usuario eliminado correctamente");
      await cargarUsuarios(busqueda);
    } catch (e: any) {
      Alert.alert("Error", e.message || "No se pudo eliminar el usuario");
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
      <Text style={styles.title}>Usuarios</Text>

      <Button
        title="NUEVO USUARIO"
        icon={<MaterialIcons name="person-add" size={22} color="white" />}
        buttonStyle={styles.btnNuevo}
        onPress={() => router.push("/usuarios/nuevo")}
      />

      <Input
        placeholder="Buscar usuario..."
        value={busqueda}
        onChangeText={setBusqueda}
        containerStyle={styles.searchContainer}
        inputContainerStyle={styles.searchInput}
        onSubmitEditing={() => cargarUsuarios(busqueda)}
      />

      <Button
        icon={<MaterialIcons name="search" size={22} color="white" />}
        buttonStyle={styles.btnBuscar}
        onPress={() => cargarUsuarios(busqueda)}
      />

      <FlatList
        data={usuarios}
        keyExtractor={(item) => item.id_usuario.toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <Card containerStyle={styles.card}>
            <Text style={styles.nombre}>{item.nombre_completo}</Text>

            <Text style={styles.info}>Rol: {item.rol}</Text>
            <Text style={styles.info}>Correo: {item.correo}</Text>
            <Text style={styles.info}>
              Teléfono: {item.telefono || "No registrado"}
            </Text>
            <Text style={styles.info}>
              Creado: {item.fecha_creacion.split("T")[0]}
            </Text>
            <Text style={styles.info}>
              Último acceso:{" "}
              {item.ultimo_acceso ? item.ultimo_acceso.split("T")[0] : "Nunca"}
            </Text>

            <View style={styles.botones}>
              <Button
                icon={<MaterialIcons name="edit" size={22} color="white" />}
                buttonStyle={styles.btnEditar}
                containerStyle={styles.iconButton}
                onPress={() =>
                  router.push({
                    pathname: "/usuarios/editar",
                    params: { id: item.id_usuario },
                  })
                }
              />
              <Button
                icon={<MaterialIcons name="delete" size={22} color="white" />}
                buttonStyle={styles.btnEliminar}
                containerStyle={styles.iconButton}
                onPress={() => setUsuarioAEliminar(item.id_usuario)}
              />
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No hay usuarios registrados</Text>
        }
      />

      <Dialog
        isVisible={usuarioAEliminar !== null}
        onBackdropPress={() => setUsuarioAEliminar(null)}
      >
        <Dialog.Title title="Eliminar usuario" />
        <Text style={{ marginBottom: 20 }}>
          ¿Está seguro de que desea eliminar este usuario?
        </Text>
        <Dialog.Actions>
          <Dialog.Button
            title="CANCELAR"
            onPress={() => setUsuarioAEliminar(null)}
          />
          <Dialog.Button
            title={eliminando ? "ELIMINANDO..." : "ELIMINAR"}
            onPress={eliminarUsuario}
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
