import { apiFetch } from "./apiFetch";
const BASE_URL = "http://localhost:3001/api";

// Metodo de pago disponible para registrar cobros.
export interface MetodoPago {
  id_metodo: number;
  codigo: "TARJETA" | "SINPE" | "PAYPAL";
  nombre: string;
  requiere_referencia: boolean;
}

// Producto agregado al cobro cuando el pago incluye repuestos o inventario.
export interface ItemCarrito {
  id_producto: number;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
  stock_disponible: number;
  unidad_medida: string;
}

// Datos que se envian al backend al registrar un pago.
export interface PagoInput {
  id_cita?: number | null;
  id_usuario: number;
  id_metodo: number;
  monto: number;
  observaciones?: string | null;
  datos_pasarela:
    | {
        tipo: "TARJETA";
        numero_tarjeta: string;
        fecha_vencimiento: string;
        cvv: string;
      }
    | {
        tipo: "SINPE";
        telefono: string;
      };
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
  id_transaccion: number;
  codigo_autorizacion: string;
  metodo: "TARJETA" | "SINPE" | "PAYPAL";
  marca_tarjeta?: "VISA" | "MASTERCARD" | null;
  banco: string;
  mensaje: string;
}

export interface OrdenPayPalInput {
  id_cita?: number | null;
  id_usuario: number;
  id_metodo: number;
  monto: number;
  observaciones?: string | null;
  productos: {
    id_producto: number;
    cantidad: number;
    precio_unitario: number;
  }[];
}

export interface OrdenPayPalResult {
  referencia: string;
  paypal_order_id: string;
  url_aprobacion: string;
  monto_crc: number;
  monto_usd: number;
  moneda: "USD";
}

export interface CapturaPayPalResult {
  id_pago: number;
  numero_factura: string;
  id_transaccion: number;
  paypal_order_id: string;
  paypal_capture_id: string;
  metodo: "PAYPAL";
  monto_crc: number;
  monto_usd: number;
  moneda: "USD";
  mensaje: string;
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
    apiFetch(`${BASE_URL}/pagos/metodos/lista`).then(handle),

  // Trae todos los pagos registrados para reportes y listados.
  getAll: () => apiFetch(`${BASE_URL}/pagos`).then(handle),

  // Trae un pago especifico por id.
  getById: (id: number) => apiFetch(`${BASE_URL}/pagos/${id}`).then(handle),

  // Guarda un pago con su metodo, monto y productos asociados.
  registrar: (data: PagoInput): Promise<PagoResult> =>
    apiFetch(`${BASE_URL}/pagos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),

  crearOrdenPayPal: (data: OrdenPayPalInput): Promise<OrdenPayPalResult> =>
    apiFetch(`${BASE_URL}/pagos/paypal/ordenes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),

  capturarOrdenPayPal: (
    referencia: string,
    paypalOrderId: string,
  ): Promise<CapturaPayPalResult> =>
    apiFetch(
      `${BASE_URL}/pagos/paypal/ordenes/${encodeURIComponent(referencia)}/capturar`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paypal_order_id: paypalOrderId }),
      },
    ).then(handle),

  cancelarOrdenPayPal: (referencia: string): Promise<{ estado: string }> =>
    apiFetch(
      `${BASE_URL}/pagos/paypal/ordenes/${encodeURIComponent(referencia)}/cancelar`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      },
    ).then(handle),
};
