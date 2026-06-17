import { Dimensions } from "react-native";

// Toma el tamano actual de la pantalla para adaptar textos y espacios.
const { width, height } = Dimensions.get("window");

// Flags simples para saber si la app corre en tablet o pantalla pequena.
const isTablet = width >= 768;
const isSmall = width < 375;

// Escala de fuentes para mantener lectura consistente entre dispositivos.
export const fs = (size: number) => {
  if (isTablet) return Math.round(size * 1.2);
  if (isSmall) return Math.round(size * 0.9);
  return size;
};

// Escala de espaciado para que margenes y paddings no se vean extremos.
export const sp = (size: number) => {
  if (isTablet) return Math.round(size * 1.3);
  if (isSmall) return Math.round(size * 0.9);
  return size;
};

// Datos de pantalla reutilizables en componentes responsivos.
export const screen = { width, height, isTablet, isSmall };
