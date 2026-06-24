import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../../constants/colors";
import { fs, sp } from "../../constants/responsive";

type DatePickerFieldProps = {
  value: string;
  onChange: (value: string) => void;
  errorMessage?: string;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  allowClear?: boolean;
};

const toDateValue = (value: string) => {
  if (!value) return new Date();

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return new Date();

  return new Date(year, month - 1, day);
};

const toDateString = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;

const formatDisplayDate = (value: string) => {
  if (!value) return "";

  const date = toDateValue(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const webInputStyle: React.CSSProperties = {
  flex: 1,
  alignSelf: "stretch",
  border: 0,
  backgroundColor: "transparent",
  color: Colors.primary,
  fontSize: fs(14),
  outline: "none",
};

export function DatePickerField({
  value,
  onChange,
  errorMessage,
  placeholder = "Seleccionar fecha",
  minimumDate,
  maximumDate,
  allowClear = false,
}: DatePickerFieldProps) {
  const [showPicker, setShowPicker] = useState(false);
  const selectedDate = toDateValue(value);
  const minValue = minimumDate ? toDateString(minimumDate) : undefined;
  const maxValue = maximumDate ? toDateString(maximumDate) : undefined;

  const handleChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS !== "ios") setShowPicker(false);
    if (event.type === "dismissed" || !date) return;

    onChange(toDateString(date));
  };

  if (Platform.OS === "web") {
    return (
      <View style={styles.wrapper}>
        <View style={[styles.field, errorMessage ? styles.fieldError : null]}>
          {React.createElement("input", {
            type: "date",
            value,
            min: minValue,
            max: maxValue,
            onChange: (event: { target: { value: string } }) =>
              onChange(event.target.value),
            style: webInputStyle,
          })}
          {allowClear && value ? (
            <TouchableOpacity
              accessibilityLabel="Limpiar fecha"
              activeOpacity={0.7}
              hitSlop={sp(8)}
              onPress={() => onChange("")}
            >
              <MaterialIcons name="close" size={20} color={Colors.gray} />
            </TouchableOpacity>
          ) : null}
          <MaterialIcons
            name="calendar-today"
            size={20}
            color={Colors.primary}
          />
        </View>

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={[styles.field, errorMessage ? styles.fieldError : null]}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.openButton}
          onPress={() => setShowPicker(true)}
        >
          <Text style={[styles.value, !value ? styles.placeholder : null]}>
            {formatDisplayDate(value) || placeholder}
          </Text>
        </TouchableOpacity>
        {allowClear && value ? (
          <TouchableOpacity
            accessibilityLabel="Limpiar fecha"
            activeOpacity={0.7}
            hitSlop={sp(8)}
            onPress={() => onChange("")}
          >
            <MaterialIcons name="close" size={20} color={Colors.gray} />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          accessibilityLabel="Abrir calendario"
          activeOpacity={0.7}
          hitSlop={sp(8)}
          onPress={() => setShowPicker(true)}
        >
          <MaterialIcons
            name="calendar-today"
            size={20}
            color={Colors.primary}
          />
        </TouchableOpacity>
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      {showPicker ? (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "calendar"}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: sp(8) },
  field: {
    minHeight: sp(50),
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: sp(6),
    paddingHorizontal: sp(10),
    backgroundColor: Colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: sp(8),
  },
  fieldError: { borderColor: "#993C1D" },
  openButton: {
    flex: 1,
    alignSelf: "stretch",
    justifyContent: "center",
  },
  value: {
    fontSize: fs(14),
    color: Colors.primary,
  },
  placeholder: { color: Colors.gray },
  errorText: {
    fontSize: fs(12),
    color: "#993C1D",
    marginLeft: sp(10),
    marginTop: sp(4),
  },
});
