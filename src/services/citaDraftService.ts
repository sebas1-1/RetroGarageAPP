import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const DRAFT_KEY = "retrogarage.citas.nueva.borrador";

export type CitaDraft = {
  id_cliente: string;
  id_servicio: string;
  marca_vehiculo: string;
  modelo_vehiculo: string;
  anio_vehiculo: string;
  fecha: string;
  hora: string;
  descripcion: string;
  estado: string;
};

const DRAFT_FIELDS: (keyof CitaDraft)[] = [
  "id_cliente",
  "id_servicio",
  "marca_vehiculo",
  "modelo_vehiculo",
  "anio_vehiculo",
  "fecha",
  "hora",
  "descripcion",
  "estado",
];

function isCitaDraft(value: unknown): value is CitaDraft {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return DRAFT_FIELDS.every((field) => typeof candidate[field] === "string");
}

function getWebStorage() {
  return typeof window === "undefined" ? null : window.localStorage;
}

async function getRawDraft() {
  if (Platform.OS === "web") {
    return getWebStorage()?.getItem(DRAFT_KEY) ?? null;
  }
  return SecureStore.getItemAsync(DRAFT_KEY);
}

async function setRawDraft(value: string) {
  if (Platform.OS === "web") {
    getWebStorage()?.setItem(DRAFT_KEY, value);
    return;
  }
  await SecureStore.setItemAsync(DRAFT_KEY, value);
}

async function removeRawDraft() {
  if (Platform.OS === "web") {
    getWebStorage()?.removeItem(DRAFT_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(DRAFT_KEY);
}

export const citaDraftService = {
  async get(): Promise<CitaDraft | null> {
    try {
      const rawDraft = await getRawDraft();
      if (!rawDraft) return null;

      const draft: unknown = JSON.parse(rawDraft);
      if (isCitaDraft(draft)) return draft;

      await removeRawDraft();
      return null;
    } catch {
      return null;
    }
  },

  async save(draft: CitaDraft) {
    try {
      await setRawDraft(JSON.stringify(draft));
      return true;
    } catch {
      return false;
    }
  },

  async remove() {
    try {
      await removeRawDraft();
      return true;
    } catch {
      return false;
    }
  },
};
