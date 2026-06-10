import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

const isTablet = width >= 768;
const isSmall = width < 375;

// Escala de fuentes
export const fs = (size: number) => {
  if (isTablet) return Math.round(size * 1.2);
  if (isSmall) return Math.round(size * 0.9);
  return size;
};

// Escala de espaciado
export const sp = (size: number) => {
  if (isTablet) return Math.round(size * 1.3);
  if (isSmall) return Math.round(size * 0.9);
  return size;
};

export const screen = { width, height, isTablet, isSmall };
