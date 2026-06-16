const BASE_URL = "http://localhost:3001/api";

export interface Servicio {
  id_servicio: number;
  id_categoria: number;
  categoria: string;
  nombre: string;
  precio_base: number;
  activo: boolean;
}

export interface Categoria {
  id_categoria: number;
  nombre: string;
}

export type ServicioInput = {
  id_categoria: number;
  nombre: string;
  precio_base: number;
};

async function handle(res: Response) {
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Error de red");
  return json;
}

export const serviciosService = {
  getAll: (buscar = "") =>
    fetch(
      `${BASE_URL}/servicios${buscar ? `?buscar=${encodeURIComponent(buscar)}` : ""}`,
    ).then(handle),

  getById: (id: number) => fetch(`${BASE_URL}/servicios/${id}`).then(handle),

  getCategorias: () => fetch(`${BASE_URL}/servicios/categorias`).then(handle),

  crear: (data: ServicioInput) =>
    fetch(`${BASE_URL}/servicios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),

  editar: (id: number, data: ServicioInput) =>
    fetch(`${BASE_URL}/servicios/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),

  eliminar: (id: number) =>
    fetch(`${BASE_URL}/servicios/${id}`, { method: "DELETE" }).then(handle),
};
