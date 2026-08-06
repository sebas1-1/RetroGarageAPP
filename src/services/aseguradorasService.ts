import { SIMULATIONS_API_BASE_URL } from "../config/api";

export interface PolizaSocio {
  id_poliza: number;
  aseguradora: string;
  numero_poliza: string;
  placa: string;
  identificacion_cliente: string;
  tipo_cobertura: string;
  deducible: number;
  fecha_inicio: string;
  fecha_vencimiento: string;
  activa: boolean;
  vigente: boolean;
}

export const aseguradorasService = {
  buscarPorPlaca: async (placa: string): Promise<PolizaSocio | null> => {
    const placaLimpia = placa.trim().replace(/[-\s]/g, "").toUpperCase();

    if (!placaLimpia) {
      return null;
    }

    const respuesta = await fetch(
      `${SIMULATIONS_API_BASE_URL}/socios/aseguradoras/polizas/${encodeURIComponent(
        placaLimpia,
      )}`,
    );

    if (respuesta.status === 404) {
      return null;
    }

    if (!respuesta.ok) {
      throw new Error("No fue posible consultar la póliza del vehículo");
    }

    return respuesta.json();
  },
};
