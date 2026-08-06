import { SIMULATIONS_API_BASE_URL } from "../config/api";

export interface OfertaRepuesto {
  id_repuesto: number;
  proveedor: string;
  codigo: string;
  nombre: string;
  marca: string | null;
  precio: number;
  existencia: number;
  tiempo_entrega_dias: number;
}

export const proveedoresService = {
  buscar: async (termino: string): Promise<OfertaRepuesto[]> => {
    const terminoLimpio = termino.trim();

    if (!terminoLimpio) {
      return [];
    }

    const respuesta = await fetch(
      `${SIMULATIONS_API_BASE_URL}/socios/proveedores/repuestos?buscar=${encodeURIComponent(
        terminoLimpio,
      )}`,
    );

    if (!respuesta.ok) {
      throw new Error(
        "No fue posible consultar el catálogo de proveedores",
      );
    }

    return respuesta.json();
  },

  buscarPorCodigo: async (
    codigo: string,
  ): Promise<OfertaRepuesto[]> => {
    const codigoLimpio = codigo.trim().toUpperCase();

    if (!codigoLimpio) {
      return [];
    }

    const respuesta = await fetch(
      `${SIMULATIONS_API_BASE_URL}/socios/proveedores/repuestos/${encodeURIComponent(
        codigoLimpio,
      )}`,
    );

    if (respuesta.status === 404) {
      return [];
    }

    if (!respuesta.ok) {
      throw new Error(
        "No fue posible consultar los repuestos de proveedores",
      );
    }

    return respuesta.json();
  },
};
