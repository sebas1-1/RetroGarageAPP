import { SIMULATIONS_API_BASE_URL } from "../config/api";

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

export const alquileresService = {
  getDisponibles: async (
    categoria = "",
  ): Promise<VehiculoAlquilerSocio[]> => {
    const categoriaLimpia = categoria.trim();
    const query = categoriaLimpia
      ? `?categoria=${encodeURIComponent(categoriaLimpia)}`
      : "";

    const respuesta = await fetch(
      `${SIMULATIONS_API_BASE_URL}/socios/alquileres/disponibles${query}`,
    );

    if (!respuesta.ok) {
      throw new Error(
        "No fue posible consultar los vehículos sustitutos",
      );
    }

    return respuesta.json();
  },
};
