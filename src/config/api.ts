const removeTrailingSlashes = (value: string) =>
  value.trim().replace(/\/+$/, "");

const DEFAULT_API_URL = "https://retrogarage-api.onrender.com/api";
const DEFAULT_SIMULATIONS_API_URL =
  "https://retrogarage-simulaciones.onrender.com";

export const API_BASE_URL = removeTrailingSlashes(
  process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL,
);

export const SIMULATIONS_API_BASE_URL = removeTrailingSlashes(
  process.env.EXPO_PUBLIC_SIMULATIONS_API_URL || DEFAULT_SIMULATIONS_API_URL,
);
