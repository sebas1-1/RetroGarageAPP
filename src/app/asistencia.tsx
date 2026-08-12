import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Input, Text } from "@rneui/themed";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { MessageDialog } from "../components/shared/MessageDialog";
import { Colors } from "../constants/colors";
import { fs, sp } from "../constants/responsive";
import { GruaSocio, gruasService } from "../services/gruasService";

// Consulta unidades externas disponibles para asistencia vial.
export default function AsistenciaVialScreen() {
  const router = useRouter();
  const [provincia, setProvincia] = useState("");
  const [gruas, setGruas] = useState<GruaSocio[]>([]);
  const [consultando, setConsultando] = useState(false);
  const [consultaRealizada, setConsultaRealizada] = useState(false);
  const [messageDialog, setMessageDialog] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const buscarGruas = async () => {
    if (consultando) return;

    try {
      setConsultando(true);
      const disponibles = await gruasService.getDisponibles(provincia);
      setGruas(disponibles);
      setConsultaRealizada(true);
    } catch (error) {
      setGruas([]);
      setConsultaRealizada(false);
      setMessageDialog({
        title: "Error",
        message:
          error instanceof Error
            ? error.message
            : "No fue posible consultar la asistencia vial",
      });
    } finally {
      setConsultando(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <MaterialIcons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>RETRO GARAGE</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.titleSection}>
          <Text style={styles.title}>Asistencia vial</Text>
          <Text style={styles.subtitle}>
            Consulta grúas disponibles de socios comerciales
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.searchSection}>
          <Text style={styles.fieldLabel}>PROVINCIA</Text>
          <Input
            placeholder="Ej. San Jose (opcional)"
            value={provincia}
            onChangeText={setProvincia}
            onSubmitEditing={buscarGruas}
            returnKeyType="search"
            autoCapitalize="words"
            inputStyle={styles.inputText}
            inputContainerStyle={styles.inputContainer}
            containerStyle={styles.inputWrapper}
            rightIcon={
              consultando ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <TouchableOpacity
                  style={styles.searchButton}
                  onPress={buscarGruas}
                  accessibilityRole="button"
                  accessibilityLabel="Buscar grúas disponibles"
                >
                  <MaterialIcons
                    name="search"
                    size={17}
                    color={Colors.cream}
                  />
                  <Text style={styles.searchButtonText}>BUSCAR</Text>
                </TouchableOpacity>
              )
            }
          />
          <Text style={styles.helperText}>
            Déjalo vacío para consultar todas las provincias.
          </Text>
        </View>

        {consultaRealizada ? (
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <Text style={styles.sectionLabel}>GRÚAS DISPONIBLES</Text>
              <Text style={styles.resultsCount}>{gruas.length} unidad(es)</Text>
            </View>

            {gruas.length === 0 ? (
              <View style={styles.emptyCard}>
                <MaterialIcons
                  name="local-shipping"
                  size={28}
                  color={Colors.gray}
                />
                <Text style={styles.emptyTitle}>Sin unidades disponibles</Text>
                <Text style={styles.emptyText}>
                  Prueba otra provincia o consulta todas las ubicaciones.
                </Text>
              </View>
            ) : (
              gruas.map((grua) => (
                <View key={grua.id_grua} style={styles.gruaCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.companyRow}>
                      <View style={styles.iconBox}>
                        <MaterialIcons
                          name="local-shipping"
                          size={22}
                          color={Colors.primary}
                        />
                      </View>
                      <View style={styles.companyInfo}>
                        <Text style={styles.companyName}>{grua.empresa}</Text>
                        <Text style={styles.location}>
                          {grua.canton}, {grua.provincia}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.timeBadge}>
                      <Text style={styles.timeValue}>
                        {grua.tiempo_estimado_minutos} min
                      </Text>
                      <Text style={styles.timeLabel}>LLEGADA</Text>
                    </View>
                  </View>

                  <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>TIPO</Text>
                      <Text style={styles.detailValue}>{grua.tipo_grua}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>CAPACIDAD</Text>
                      <Text style={styles.detailValue}>
                        {grua.capacidad_toneladas} t
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>TARIFA BASE</Text>
                      <Text style={styles.priceValue}>
                        ₡{grua.tarifa_base.toLocaleString("es-CR")}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.contactRow}>
                    <MaterialIcons
                      name="phone"
                      size={17}
                      color={Colors.gray}
                    />
                    <Text style={styles.phone}>{grua.telefono}</Text>
                    <Text style={styles.plate}>Unidad {grua.placa}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : (
          <View style={styles.initialCard}>
            <MaterialIcons
              name="local-shipping"
              size={36}
              color={Colors.gray}
            />
            <Text style={styles.initialTitle}>Busca asistencia cercana</Text>
            <Text style={styles.initialText}>
              Compara tiempo de llegada, capacidad y tarifa base.
            </Text>
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
  backButton: {
    width: sp(40),
    height: sp(40),
    justifyContent: "center",
  },
  headerTitle: {
    color: Colors.white,
    fontSize: fs(14),
    fontWeight: "600",
    letterSpacing: 2,
  },
  headerSpacer: { width: sp(40) },
  scroll: { flex: 1, paddingHorizontal: sp(20) },
  titleSection: { paddingVertical: sp(20) },
  title: { color: Colors.primary, fontSize: fs(22), fontWeight: "600" },
  subtitle: { color: Colors.gray, fontSize: fs(13), marginTop: sp(4) },
  divider: { height: 1, backgroundColor: Colors.border },
  searchSection: { paddingVertical: sp(18) },
  fieldLabel: {
    color: Colors.primary,
    fontSize: fs(11),
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: sp(2),
    marginLeft: sp(10),
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: sp(10),
    paddingHorizontal: sp(10),
    backgroundColor: Colors.white,
  },
  inputText: { color: Colors.primary, fontSize: fs(14) },
  inputWrapper: { paddingHorizontal: 0, marginBottom: 0 },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: sp(4),
    backgroundColor: Colors.accent,
    borderRadius: sp(5),
    paddingHorizontal: sp(9),
    paddingVertical: sp(7),
  },
  searchButtonText: {
    color: Colors.white,
    fontSize: fs(10),
    fontWeight: "700",
  },
  helperText: {
    color: Colors.gray,
    fontSize: fs(11),
    marginTop: sp(-4),
    marginLeft: sp(2),
  },
  resultsSection: { paddingTop: sp(8) },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: sp(12),
  },
  sectionLabel: {
    color: Colors.gray,
    fontSize: fs(11),
    fontWeight: "600",
    letterSpacing: 1.2,
  },
  resultsCount: { color: Colors.gray, fontSize: fs(11) },
  gruaCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: sp(10),
    padding: sp(14),
    marginBottom: sp(10),
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: sp(12),
  },
  companyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: sp(10),
    flex: 1,
  },
  iconBox: {
    width: sp(42),
    height: sp(42),
    borderRadius: sp(8),
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  companyInfo: { flex: 1 },
  companyName: {
    color: Colors.primary,
    fontSize: fs(14),
    fontWeight: "700",
  },
  location: { color: Colors.gray, fontSize: fs(11), marginTop: sp(2) },
  timeBadge: {
    alignItems: "center",
    backgroundColor: Colors.successSoft,
    borderRadius: sp(6),
    paddingHorizontal: sp(10),
    paddingVertical: sp(6),
  },
  timeValue: { color: Colors.success, fontSize: fs(13), fontWeight: "700" },
  timeLabel: { color: Colors.success, fontSize: fs(8), marginTop: sp(1) },
  detailsGrid: {
    flexDirection: "row",
    gap: sp(8),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    paddingVertical: sp(12),
    marginVertical: sp(12),
  },
  detailItem: { flex: 1 },
  detailLabel: {
    color: Colors.gray,
    fontSize: fs(9),
    fontWeight: "600",
    marginBottom: sp(3),
  },
  detailValue: { color: Colors.primary, fontSize: fs(11), fontWeight: "600" },
  priceValue: { color: Colors.success, fontSize: fs(11), fontWeight: "700" },
  contactRow: { flexDirection: "row", alignItems: "center", gap: sp(6) },
  phone: { color: Colors.primary, fontSize: fs(12), fontWeight: "600" },
  plate: { color: Colors.gray, fontSize: fs(10), marginLeft: "auto" },
  initialCard: {
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: sp(10),
    backgroundColor: Colors.white,
    paddingVertical: sp(36),
    paddingHorizontal: sp(20),
    marginTop: sp(24),
  },
  initialTitle: {
    color: Colors.primary,
    fontSize: fs(15),
    fontWeight: "600",
    marginTop: sp(10),
  },
  initialText: {
    color: Colors.gray,
    fontSize: fs(12),
    textAlign: "center",
    marginTop: sp(4),
  },
  emptyCard: {
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: sp(10),
    backgroundColor: Colors.white,
    padding: sp(24),
  },
  emptyTitle: {
    color: Colors.primary,
    fontSize: fs(14),
    fontWeight: "600",
    marginTop: sp(8),
  },
  emptyText: {
    color: Colors.gray,
    fontSize: fs(11),
    textAlign: "center",
    marginTop: sp(3),
  },
  footer: {
    color: Colors.gray,
    fontSize: fs(11),
    textAlign: "center",
    marginVertical: sp(32),
  },
});
