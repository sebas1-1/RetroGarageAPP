import { Dialog, Text } from "@rneui/themed";
import { StyleSheet } from "react-native";
import { Colors } from "../../constants/colors";
import { sp } from "../../constants/responsive";

type MessageDialogProps = {
  title: string;
  message: string;
  onClose: () => void;
  visible: boolean;
};

// Dialogo reutilizable para mostrar errores, confirmaciones o avisos simples.
export function MessageDialog({
  title,
  message,
  onClose,
  visible,
}: MessageDialogProps) {
  // Se cierra al tocar fuera o al presionar OK.
  return (
    <Dialog isVisible={visible} onBackdropPress={onClose}>
      <Dialog.Title title={title} />
      <Text style={styles.message}>{message}</Text>
      <Dialog.Actions>
        <Dialog.Button title="OK" onPress={onClose} />
      </Dialog.Actions>
    </Dialog>
  );
}

// Estilos del mensaje dentro del dialogo.
const styles = StyleSheet.create({
  message: { marginBottom: sp(20), color: Colors.primary },
});
