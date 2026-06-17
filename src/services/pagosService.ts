const BASE_URL = "http://localhost:3001/api";

export interface MetodoPago {
  id_metodo: number;
  nombre: string;
  requiere_referencia: boolean;
}

export interface ItemCarrito {
  id_producto: number;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
  unidad_medida: string;
}

export interface PagoInput {
  id_cita?: number | null;
  id_usuario: number;
  id_metodo: number;
  monto: number;
  monto_recibido?: number | null;
  cambio?: number | null;
  numero_referencia?: string | null;
  banco?: string | null;
  observaciones?: string | null;
  productos: {
    id_producto: number;
    cantidad: number;
    precio_unitario: number;
  }[];
}

export interface PagoResult {
  id_pago: number;
  numero_factura: string;
}

async function handle(res: Response) {
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Error de red");
  return json;
}

export const pagosService = {
  getMetodos: (): Promise<MetodoPago[]> =>
    fetch(`${BASE_URL}/pagos/metodos/lista`).then(handle),

  getAll: () => fetch(`${BASE_URL}/pagos`).then(handle),

  getById: (id: number) => fetch(`${BASE_URL}/pagos/${id}`).then(handle),

  registrar: (data: PagoInput): Promise<PagoResult> =>
    fetch(`${BASE_URL}/pagos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),
};
