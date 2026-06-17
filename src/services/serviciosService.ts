const BASE_URL = "http://localhost:3001/api";

// Servicio que ofrece el taller y que puede usarse en citas o pagos.
export interface Servicio {
  id_servicio: number;
  id_categoria: number;
  categoria: string;
  nombre: string;
  precio_base: number;
  activo: boolean;
}

// Categoria reducida usada para asignar un servicio.
export interface Categoria {
  id_categoria: number;
  nombre: string;
}

export type ServicioInput = {
  id_categoria: number;
  nombre: string;
  precio_base: number;
};

// Centraliza conversion a JSON y errores de red/API.
async function handle(res: Response) {
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Error de red");
  return json;
}

// Operaciones de servicios usadas por listado, nuevo y editar.
export const serviciosService = {
  // Lista servicios y permite filtrar por texto.
  getAll: (buscar = "") =>
    fetch(
      `${BASE_URL}/servicios${buscar ? `?buscar=${encodeURIComponent(buscar)}` : ""}`,
    ).then(handle),

  // Obtiene un servicio por id.
  getById: (id: number) => fetch(`${BASE_URL}/servicios/${id}`).then(handle),

  // Carga categorias disponibles para servicios.
  getCategorias: () => fetch(`${BASE_URL}/servicios/categorias`).then(handle),

  // Crea un servicio nuevo con categoria y precio base.
  crear: (data: ServicioInput) =>
    fetch(`${BASE_URL}/servicios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),

  // Actualiza un servicio existente.
  editar: (id: number, data: ServicioInput) =>
    fetch(`${BASE_URL}/servicios/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),

  // Elimina un servicio por id.
  eliminar: (id: number) =>
    fetch(`${BASE_URL}/servicios/${id}`, { method: "DELETE" }).then(handle),
};
