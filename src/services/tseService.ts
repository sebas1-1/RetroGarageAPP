import { SIMULATIONS_API_BASE_URL } from "../config/api";

export interface PersonaTSE {
  identificacion: number;
  nombre: string | null;
  apellido: string | null;
  fecha_nacimiento: string | null;
}

export const tseService = {
  buscarPorIdentificacion: async (
    identificacion: string,
  ): Promise<PersonaTSE | null> => {
    const identificacionLimpia = identificacion.replace(/\D/g, "");

    const respuesta = await fetch(
      `${SIMULATIONS_API_BASE_URL}/clientes/${identificacionLimpia}`,
    );

    if (respuesta.status === 404) {
      return null;
    }

    if (!respuesta.ok) {
      throw new Error("No fue posible consultar los datos de la persona");
    }

    return respuesta.json();
  },
};
