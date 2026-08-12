// Sistema visual Midnight Copper Garage.
// Los colores semanticos evitan que cada pantalla invente sus propios tonos.
export const StandardColors = {
  // Marca y navegación.
  primary: "#102A43",
  primaryDark: "#091B2C",
  accent: "#B8562A",
  accentLight: "#F0B38F",
  accentSoft: "#F4E0D5",
  secondary: "#0F5C5E",
  secondarySoft: "#DDECE9",

  // Fondos, superficies y separadores.
  cream: "#FAF6EE",
  surfaceAlt: "#F2ECE1",
  white: "#FFFFFF",
  border: "#D9CEBF",
  borderStrong: "#877A69",

  // Texto.
  text: "#1F2933",
  gray: "#5B6875",
  disabled: "#8A929A",

  // Estados. Cada estado debe acompañarse de texto o icono.
  success: "#16724B",
  successSoft: "#DDEDE5",
  danger: "#B42318",
  dangerSoft: "#F8E3E0",
  warning: "#955A00",
  warningSoft: "#F7E9CC",
  info: "#285F8F",
  infoSoft: "#E2EDF6",

  // Capas y sombras suaves.
  overlay: "rgba(9, 27, 44, 0.48)",
  loginOverlay: "rgba(9, 27, 44, 0.72)",
  loginCard: "rgba(250, 246, 238, 0.97)",
  shadow: "#091B2C",
};

export type AppColors = {
  [Key in keyof typeof StandardColors]: string;
};

// Variante de accesibilidad con superficies limpias, bordes fuertes y
// contrastes reforzados. Conserva el significado semantico de cada color.
export const HighContrastColors: AppColors = {
  primary: "#00111F",
  primaryDark: "#000000",
  accent: "#8C2F0B",
  accentLight: "#FFD8C2",
  accentSoft: "#FFF0E8",
  secondary: "#00484A",
  secondarySoft: "#E5FFFF",
  cream: "#FFFFFF",
  surfaceAlt: "#F2F2F2",
  white: "#FFFFFF",
  border: "#4A4A4A",
  borderStrong: "#000000",
  text: "#000000",
  gray: "#333333",
  disabled: "#5C5C5C",
  success: "#006B3C",
  successSoft: "#E1F8EB",
  danger: "#A40000",
  dangerSoft: "#FFE5E5",
  warning: "#704000",
  warningSoft: "#FFF0C2",
  info: "#004C8C",
  infoSoft: "#E1F0FF",
  overlay: "rgba(0, 0, 0, 0.68)",
  loginOverlay: "rgba(0, 0, 0, 0.82)",
  loginCard: "rgba(255, 255, 255, 0.99)",
  shadow: "#000000",
};

// Alias retrocompatible para utilidades que no se renderizan dentro de React.
export const Colors: AppColors = StandardColors;
