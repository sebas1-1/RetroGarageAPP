import { Dialog, Text } from "@rneui/themed";
import { StyleSheet } from "react-native";
import type { AppColors } from "../../constants/colors";
import { sp } from "../../constants/responsive";
import { useThemedStyles } from "../../contexts/AccessibilityThemeContext";

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
  const { styles } = useThemedStyles(createStyles);
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
const createStyles = (Colors: AppColors) => StyleSheet.create({
  message: { marginBottom: sp(20), color: Colors.primary },
});
