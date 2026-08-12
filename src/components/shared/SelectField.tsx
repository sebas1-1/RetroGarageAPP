import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Text } from "@rneui/themed";
import { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet } from "react-native";
import type { AppColors } from "../../constants/colors";
import { fs, sp } from "../../constants/responsive";
import { useThemedStyles } from "../../contexts/AccessibilityThemeContext";
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
  const { colors: Colors, styles } = useThemedStyles(createStyles);
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

const createStyles = (Colors: AppColors) => StyleSheet.create({
  field: { minHeight: sp(48), flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: Colors.borderStrong, borderRadius: sp(10), paddingHorizontal: sp(12), backgroundColor: Colors.white, marginBottom: sp(12) },
  errorBorder: { borderColor: Colors.danger },
  disabled: { opacity: 0.55 },
  value: { flex: 1, fontSize: fs(14), color: Colors.primary },
  placeholder: { color: Colors.gray },
  error: { color: Colors.danger, fontSize: fs(12), marginTop: sp(-8), marginLeft: sp(10), marginBottom: sp(10) },
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: "center", padding: sp(24) },
  modal: { maxHeight: "70%", backgroundColor: Colors.white, borderRadius: sp(14), padding: sp(16) },
  title: { fontSize: fs(17), fontWeight: "600", color: Colors.primary, marginBottom: sp(10) },
  option: { paddingVertical: sp(14), paddingHorizontal: sp(10), borderBottomWidth: 1, borderBottomColor: Colors.border },
  optionSelected: { backgroundColor: Colors.secondarySoft },
  optionText: { fontSize: fs(15), color: Colors.primary },
});
