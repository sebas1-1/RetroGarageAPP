const BASE_URL = "http://localhost:3001/api";

export interface Producto {
  id_producto: number;
  id_categoria: number;
  nombre: string;
  codigo_item: string;
  precio_venta: number;
  precio_costo: number;
  stock_actual: number;
  stock_minimo: number;
  unidad_medida: "Unidades" | "Litros" | "Metros";
  proveedor: string | null;
  activo: boolean;
  categoria_nombre?: string;
}

export type ProductoInput = {
  id_categoria: number;
  nombre: string;
  codigo_item: string;
  precio_venta: number;
  precio_costo: number;
  stock_actual: number;
  stock_minimo: number;
  unidad_medida: string;
  proveedor: string | null;
};

export type EstadoStock = "NORMAL" | "STOCK BAJO" | "AGOTADO";

export function getEstadoStock(producto: Producto): EstadoStock {
  if (producto.stock_actual <= 0) return "AGOTADO";
  if (producto.stock_actual <= producto.stock_minimo) return "STOCK BAJO";
  return "NORMAL";
}

async function handle(res: Response) {
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Error de red");
  return json;
}

export const inventarioService = {
  getAll: (): Promise<Producto[]> =>
    fetch(`${BASE_URL}/productos`).then(handle),

  getById: (id: number): Promise<Producto> =>
    fetch(`${BASE_URL}/productos/${id}`).then(handle),

  crear: (data: ProductoInput): Promise<Producto> =>
    fetch(`${BASE_URL}/productos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),

  editar: (id: number, data: ProductoInput): Promise<Producto> =>
    fetch(`${BASE_URL}/productos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),

  marcarAgotado: (id: number): Promise<Producto> =>
    fetch(`${BASE_URL}/productos/${id}/agotado`, {
      method: "PATCH",
    }).then(handle),

  eliminar: (id: number): Promise<void> =>
    fetch(`${BASE_URL}/productos/${id}`, { method: "DELETE" }).then(handle),
};
