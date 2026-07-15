import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Text } from "@rneui/themed";
import { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet } from "react-native";
import { Colors } from "../../constants/colors";
import { fs, sp } from "../../constants/responsive";
import { OpcionGeografica } from "../../services/geografiaService";

type Props = {
  value: number | null;
  options: OpcionGeografica[];
  placeholder: string;
  onChange: (value: number) => void;
  disabled?: boolean;
  loading?: boolean;
  errorMessage?: string;
};

export function SelectField({ value, options, placeholder, onChange, disabled, loading, errorMessage }: Props) {
  const [visible, setVisible] = useState(false);
  const selected = options.find((option) => option.id === value);

  return (
    <>
      <Pressable
        disabled={disabled || loading}
        onPress={() => setVisible(true)}
        style={[styles.field, errorMessage && styles.errorBorder, (disabled || loading) && styles.disabled]}
      >
        <Text style={[styles.value, !selected && styles.placeholder]}>
          {loading ? "Cargando..." : selected?.descripcion ?? placeholder}
        </Text>
        <MaterialIcons name="arrow-drop-down" size={26} color={Colors.primary} />
      </Pressable>
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <Pressable style={styles.modal} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.title}>{placeholder}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.option, item.id === value && styles.optionSelected]}
                  onPress={() => { onChange(item.id); setVisible(false); }}
                >
                  <Text style={styles.optionText}>{item.descripcion}</Text>
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: { minHeight: sp(48), flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: Colors.border, borderRadius: sp(6), paddingHorizontal: sp(12), backgroundColor: Colors.white, marginBottom: sp(12) },
  errorBorder: { borderColor: "#993C1D" },
  disabled: { opacity: 0.55 },
  value: { flex: 1, fontSize: fs(14), color: Colors.primary },
  placeholder: { color: Colors.gray },
  error: { color: "#993C1D", fontSize: fs(12), marginTop: sp(-8), marginLeft: sp(10), marginBottom: sp(10) },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", padding: sp(24) },
  modal: { maxHeight: "70%", backgroundColor: Colors.white, borderRadius: sp(10), padding: sp(16) },
  title: { fontSize: fs(17), fontWeight: "600", color: Colors.primary, marginBottom: sp(10) },
  option: { paddingVertical: sp(14), paddingHorizontal: sp(10), borderBottomWidth: 1, borderBottomColor: Colors.border },
  optionSelected: { backgroundColor: Colors.cream },
  optionText: { fontSize: fs(15), color: Colors.primary },
});
