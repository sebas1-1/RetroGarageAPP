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

export function MessageDialog({
  title,
  message,
  onClose,
  visible,
}: MessageDialogProps) {
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

const styles = StyleSheet.create({
  message: { marginBottom: sp(20), color: Colors.primary },
});
