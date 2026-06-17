const BASE_URL = "http://localhost:3001/api";

// Metodo de pago disponible para registrar cobros.
export interface MetodoPago {
  id_metodo: number;
  nombre: string;
  requiere_referencia: boolean;
}

// Producto agregado al cobro cuando el pago incluye repuestos o inventario.
export interface ItemCarrito {
  id_producto: number;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
  unidad_medida: string;
}

// Datos que se envian al backend al registrar un pago.
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

// Respuesta minima que devuelve el backend despues de guardar el pago.
export interface PagoResult {
  id_pago: number;
  numero_factura: string;
}

// Maneja respuestas exitosas y errores de la API en un solo lugar.
async function handle(res: Response) {
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Error de red");
  return json;
}

// Servicio usado por pantallas de pagos, dashboard y estadisticas.
export const pagosService = {
  // Lista los metodos de pago configurados.
  getMetodos: (): Promise<MetodoPago[]> =>
    fetch(`${BASE_URL}/pagos/metodos/lista`).then(handle),

  // Trae todos los pagos registrados para reportes y listados.
  getAll: () => fetch(`${BASE_URL}/pagos`).then(handle),

  // Trae un pago especifico por id.
  getById: (id: number) => fetch(`${BASE_URL}/pagos/${id}`).then(handle),

  // Guarda un pago con su metodo, monto y productos asociados.
  registrar: (data: PagoInput): Promise<PagoResult> =>
    fetch(`${BASE_URL}/pagos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),
};
