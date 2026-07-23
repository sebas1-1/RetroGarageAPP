export interface GruaSocio {
  id_grua: number;
  empresa: string;
  placa: string;
  tipo_grua: string;
  provincia: string;
  canton: string;
  telefono: string;
  capacidad_toneladas: number;
  tarifa_base: number;
  tiempo_estimado_minutos: number;
  disponible: boolean;
}

const SOCIOS_API_URL =
  process.env.EXPO_PUBLIC_SOCIOS_API_URL ?? "http://127.0.0.1:8000";

export const gruasService = {
  getDisponibles: async (provincia = ""): Promise<GruaSocio[]> => {
    const provinciaLimpia = provincia.trim();
    const query = provinciaLimpia
      ? `?provincia=${encodeURIComponent(provinciaLimpia)}`
      : "";

    const respuesta = await fetch(
      `${SOCIOS_API_URL}/socios/gruas/disponibles${query}`,
    );

    if (!respuesta.ok) {
      throw new Error("No fue posible consultar las grúas disponibles");
    }

    return respuesta.json();
  },
};
