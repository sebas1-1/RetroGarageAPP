import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Text } from "@rneui/themed";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../../constants/colors";
import { fs, sp } from "../../constants/responsive";
import { pagosService } from "../../services/pagosService";

type ResultState =
  | { status: "processing"; title: string; message: string }
  | { status: "success"; title: string; message: string }
  | { status: "cancelled"; title: string; message: string }
  | { status: "error"; title: string; message: string };

const firstParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function PayPalReturnScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    orden?: string | string[];
    token?: string | string[];
    cancelado?: string | string[];
  }>();
  const handled = useRef(false);
  const [result, setResult] = useState<ResultState>({
    status: "processing",
    title: "Confirmando pago",
    message: "Estamos verificando la autorización con PayPal.",
  });

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const reference = firstParam(params.orden);
    const paypalOrderId = firstParam(params.token);
    const wasCancelled = firstParam(params.cancelado) === "1";

    const finishPayPalFlow = async () => {
      if (!reference) {
        setResult({
          status: "error",
          title: "Referencia inválida",
          message: "No fue posible identificar la orden de PayPal.",
        });
        return;
      }

      try {
        if (wasCancelled) {
          await pagosService.cancelarOrdenPayPal(reference);
          setResult({
            status: "cancelled",
            title: "Pago cancelado",
            message:
              "No se realizó ningún cobro. Puedes volver a pagos e intentarlo nuevamente.",
          });
          return;
        }

        if (!paypalOrderId) {
          setResult({
            status: "error",
            title: "Autorización incompleta",
            message:
              "PayPal no devolvió la autorización necesaria para completar el pago.",
          });
          return;
        }

        const capture = await pagosService.capturarOrdenPayPal(
          reference,
          paypalOrderId,
        );
        setResult({
          status: "success",
          title: "Pago confirmado",
          message:
            `Factura ${capture.numero_factura} generada correctamente.\n` +
            `Total: ₡${capture.monto_crc.toLocaleString("es-CR")} ` +
            `(${capture.moneda} ${capture.monto_usd.toFixed(2)}).`,
        });
      } catch (error: any) {
        setResult({
          status: "error",
          title: "No se pudo completar el pago",
          message:
            error?.message ||
            "Ocurrió un problema al confirmar la operación con PayPal.",
        });
      }
    };

    finishPayPalFlow();
  }, [params.cancelado, params.orden, params.token]);

  const iconName =
    result.status === "success"
      ? "check-circle"
      : result.status === "cancelled"
        ? "cancel"
        : result.status === "error"
          ? "error"
          : null;
  const iconColor =
    result.status === "success"
      ? Colors.success
      : result.status === "cancelled"
        ? Colors.gray
        : "#993C1D";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RETRO GARAGE</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          {result.status === "processing" ? (
            <ActivityIndicator size="large" color="#003087" />
          ) : (
            <MaterialIcons
              name={iconName!}
              size={58}
              color={iconColor}
            />
          )}

          <Text style={styles.title}>{result.title}</Text>
          <Text style={styles.message}>{result.message}</Text>

          {result.status !== "processing" && (
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.replace("/pagos")}
            >
              <Text style={styles.buttonText}>Volver a pagos</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  header: {
    backgroundColor: Colors.primary,
    alignItems: "center",
    paddingHorizontal: sp(20),
    paddingTop: sp(48),
    paddingBottom: sp(18),
  },
  headerTitle: {
    color: Colors.white,
    fontSize: fs(14),
    fontWeight: "600",
    letterSpacing: 2,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: sp(24),
  },
  card: {
    width: "100%",
    maxWidth: sp(520),
    alignSelf: "center",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: sp(12),
    paddingHorizontal: sp(24),
    paddingVertical: sp(36),
  },
  title: {
    color: Colors.primary,
    fontSize: fs(21),
    fontWeight: "700",
    textAlign: "center",
    marginTop: sp(18),
  },
  message: {
    color: Colors.gray,
    fontSize: fs(13),
    lineHeight: fs(20),
    textAlign: "center",
    marginTop: sp(10),
  },
  button: {
    width: "100%",
    backgroundColor: Colors.primary,
    borderRadius: sp(8),
    alignItems: "center",
    paddingVertical: sp(14),
    marginTop: sp(28),
  },
  buttonText: {
    color: Colors.cream,
    fontSize: fs(14),
    fontWeight: "600",
  },
});
