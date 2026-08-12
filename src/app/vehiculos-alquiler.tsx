import { useThemedStyles } from "@/contexts/AccessibilityThemeContext";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Text } from "@rneui/themed";
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
import type { AppColors } from "../constants/colors";
import { fs, sp } from "../constants/responsive";
import {
  alquileresService,
  VehiculoAlquilerSocio,
} from "../services/alquileresService";

const CATEGORIAS = ["Todas", "Economico", "Sedan", "SUV"] as const;

// Consulta vehiculos sustitutos ofrecidos por empresas asociadas.
export default function VehiculosAlquilerScreen() {
  const { colors: Colors, styles } = useThemedStyles(createStyles);
  const router = useRouter();
  const [categoria, setCategoria] =
    useState<(typeof CATEGORIAS)[number]>("Todas");
  const [vehiculos, setVehiculos] = useState<VehiculoAlquilerSocio[]>([]);
  const [consultando, setConsultando] = useState(false);
  const [consultaRealizada, setConsultaRealizada] = useState(false);
  const [messageDialog, setMessageDialog] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const consultarDisponibilidad = async () => {
    if (consultando) return;

    try {
      setConsultando(true);
      const filtro = categoria === "Todas" ? "" : categoria;
      const disponibles = await alquileresService.getDisponibles(filtro);
      setVehiculos(disponibles);
      setConsultaRealizada(true);
    } catch (error) {
      setVehiculos([]);
      setConsultaRealizada(false);
      setMessageDialog({
        title: "Error",
        message:
          error instanceof Error
            ? error.message
            : "No fue posible consultar los vehículos sustitutos",
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

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Vehículos sustitutos</Text>
          <Text style={styles.subtitle}>
            Consulta opciones mientras el automóvil está en reparación
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.filterSection}>
          <Text style={styles.sectionLabel}>CATEGORÍA</Text>
          <View style={styles.chips}>
            {CATEGORIAS.map((opcion) => (
              <TouchableOpacity
                key={opcion}
                style={[
                  styles.chip,
                  categoria === opcion && styles.chipActive,
                ]}
                onPress={() => setCategoria(opcion)}
              >
                <Text
                  style={[
                    styles.chipText,
                    categoria === opcion && styles.chipTextActive,
                  ]}
                >
                  {opcion === "Economico" ? "Económico" : opcion}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.consultButton,
              consultando && styles.consultButtonDisabled,
            ]}
            onPress={consultarDisponibilidad}
            disabled={consultando}
            accessibilityRole="button"
          >
            {consultando ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <MaterialIcons
                  name="directions-car"
                  size={19}
                  color={Colors.white}
                />
                <Text style={styles.consultButtonText}>
                  CONSULTAR DISPONIBILIDAD
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {consultaRealizada ? (
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <Text style={styles.sectionLabel}>DISPONIBLES</Text>
              <Text style={styles.resultsCount}>
                {vehiculos.length} vehículo(s)
              </Text>
            </View>

            {vehiculos.length === 0 ? (
              <View style={styles.emptyCard}>
                <MaterialIcons
                  name="car-rental"
                  size={30}
                  color={Colors.gray}
                />
                <Text style={styles.emptyTitle}>Sin vehículos disponibles</Text>
                <Text style={styles.emptyText}>
                  Prueba otra categoría o consulta todas las opciones.
                </Text>
              </View>
            ) : (
              vehiculos.map((vehiculo) => (
                <View key={vehiculo.id_vehiculo} style={styles.vehicleCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.vehicleIdentity}>
                      <View style={styles.iconBox}>
                        <MaterialIcons
                          name="directions-car"
                          size={24}
                          color={Colors.primary}
                        />
                      </View>
                      <View style={styles.vehicleInfo}>
                        <Text style={styles.vehicleName}>
                          {vehiculo.marca} {vehiculo.modelo}
                        </Text>
                        <Text style={styles.company}>
                          {vehiculo.empresa} · {vehiculo.anio}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>
                        {vehiculo.categoria === "Economico"
                          ? "ECONÓMICO"
                          : vehiculo.categoria.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                      <MaterialIcons
                        name="settings"
                        size={17}
                        color={Colors.gray}
                      />
                      <View>
                        <Text style={styles.detailLabel}>TRANSMISIÓN</Text>
                        <Text style={styles.detailValue}>
                          {vehiculo.transmision}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.detailItem}>
                      <MaterialIcons
                        name="people-outline"
                        size={17}
                        color={Colors.gray}
                      />
                      <View>
                        <Text style={styles.detailLabel}>PASAJEROS</Text>
                        <Text style={styles.detailValue}>
                          {vehiculo.cantidad_pasajeros}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.pricesRow}>
                    <View>
                      <Text style={styles.priceLabel}>TARIFA DIARIA</Text>
                      <Text style={styles.dailyPrice}>
                        ₡{vehiculo.tarifa_diaria.toLocaleString("es-CR")}
                      </Text>
                    </View>
                    <View style={styles.depositInfo}>
                      <Text style={styles.priceLabel}>DEPÓSITO</Text>
                      <Text style={styles.depositPrice}>
                        ₡{vehiculo.deposito.toLocaleString("es-CR")}
                      </Text>
                    </View>
                    <Text style={styles.plate}>{vehiculo.placa}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : (
          <View style={styles.initialCard}>
            <MaterialIcons
              name="car-rental"
              size={38}
              color={Colors.gray}
            />
            <Text style={styles.initialTitle}>
              Encuentra un vehículo sustituto
            </Text>
            <Text style={styles.initialText}>
              Selecciona una categoría para comparar tarifas y depósitos.
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

const createStyles = (Colors: AppColors) => StyleSheet.create({
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
  filterSection: { paddingVertical: sp(18) },
  sectionLabel: {
    color: Colors.gray,
    fontSize: fs(11),
    fontWeight: "600",
    letterSpacing: 1.2,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: sp(8),
    marginTop: sp(10),
  },
  chip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: sp(20),
    backgroundColor: Colors.white,
    paddingHorizontal: sp(14),
    paddingVertical: sp(8),
  },
  chipActive: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.secondary,
  },
  chipText: { color: Colors.primary, fontSize: fs(12), fontWeight: "600" },
  chipTextActive: { color: Colors.cream },
  consultButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: sp(8),
    backgroundColor: Colors.accent,
    borderRadius: sp(7),
    paddingVertical: sp(12),
    marginTop: sp(16),
  },
  consultButtonDisabled: { opacity: 0.65 },
  consultButtonText: {
    color: Colors.white,
    fontSize: fs(12),
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  resultsSection: { paddingTop: sp(8) },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: sp(12),
  },
  resultsCount: { color: Colors.gray, fontSize: fs(11) },
  vehicleCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: sp(10),
    padding: sp(14),
    marginBottom: sp(10),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: sp(10),
  },
  vehicleIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: sp(10),
    flex: 1,
  },
  iconBox: {
    width: sp(44),
    height: sp(44),
    borderRadius: sp(8),
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleInfo: { flex: 1 },
  vehicleName: {
    color: Colors.primary,
    fontSize: fs(15),
    fontWeight: "700",
  },
  company: { color: Colors.gray, fontSize: fs(11), marginTop: sp(2) },
  categoryBadge: {
    backgroundColor: Colors.infoSoft,
    borderRadius: sp(5),
    paddingHorizontal: sp(8),
    paddingVertical: sp(4),
  },
  categoryText: { color: Colors.accent, fontSize: fs(9), fontWeight: "700" },
  detailsRow: {
    flexDirection: "row",
    gap: sp(12),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    paddingVertical: sp(12),
    marginVertical: sp(12),
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: sp(7),
    flex: 1,
  },
  detailLabel: { color: Colors.gray, fontSize: fs(8), fontWeight: "600" },
  detailValue: {
    color: Colors.primary,
    fontSize: fs(11),
    fontWeight: "600",
    marginTop: sp(2),
  },
  pricesRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: sp(20),
  },
  priceLabel: { color: Colors.gray, fontSize: fs(8), fontWeight: "600" },
  dailyPrice: {
    color: Colors.success,
    fontSize: fs(16),
    fontWeight: "700",
    marginTop: sp(2),
  },
  depositInfo: { alignItems: "flex-start" },
  depositPrice: {
    color: Colors.primary,
    fontSize: fs(12),
    fontWeight: "600",
    marginTop: sp(2),
  },
  plate: {
    color: Colors.gray,
    fontSize: fs(10),
    fontWeight: "600",
    marginLeft: "auto",
  },
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
