export interface PersonaTSE {
  identificacion: number;
  nombre: string | null;
  apellido: string | null;
  fecha_nacimiento: string | null;
}

const TSE_API_URL =
  process.env.EXPO_PUBLIC_TSE_API_URL ?? "http://127.0.0.1:8000";

export const tseService = {
  buscarPorIdentificacion: async (
    identificacion: string,
  ): Promise<PersonaTSE | null> => {
    const identificacionLimpia = identificacion.replace(/\D/g, "");

    const respuesta = await fetch(
      `${TSE_API_URL}/clientes/${identificacionLimpia}`,
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