export interface VehiculoAlquilerSocio {
  id_vehiculo: number;
  empresa: string;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  categoria: string;
  transmision: string;
  cantidad_pasajeros: number;
  tarifa_diaria: number;
  deposito: number;
  disponible: boolean;
}

const SOCIOS_API_URL =
  process.env.EXPO_PUBLIC_SOCIOS_API_URL ?? "http://127.0.0.1:8000";

export const alquileresService = {
  getDisponibles: async (
    categoria = "",
  ): Promise<VehiculoAlquilerSocio[]> => {
    const categoriaLimpia = categoria.trim();
    const query = categoriaLimpia
      ? `?categoria=${encodeURIComponent(categoriaLimpia)}`
      : "";

    const respuesta = await fetch(
      `${SOCIOS_API_URL}/socios/alquileres/disponibles${query}`,
    );

    if (!respuesta.ok) {
      throw new Error(
        "No fue posible consultar los vehículos sustitutos",
      );
    }

    return respuesta.json();
  },
};
