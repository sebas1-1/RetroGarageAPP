import { apiFetch } from "./apiFetch";
const BASE_URL = "http://localhost:3001/api";

// Categoria usada para clasificar productos o servicios.
export interface Categoria {
  id_categoria: number;
  nombre: string;
  tipo: "Producto" | "Servicio";
  descripcion: string | null;
  activo: boolean;
}

export type CategoriaInput = {
  nombre: string;
  tipo: string;
  descripcion: string | null;
};

// Maneja errores del backend antes de devolver los datos a la pantalla.
async function handle(res: Response) {
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Error de red");
  return json;
}

// Servicio con las operaciones principales de categorias.
export const categoriasService = {
  // Carga todas las categorias disponibles.
  getAll: () => apiFetch(`${BASE_URL}/categorias`).then(handle),

  // Crea una categoria nueva.
  crear: (data: CategoriaInput) =>
    apiFetch(`${BASE_URL}/categorias`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),

  // Edita una categoria existente.
  editar: (id: number, data: CategoriaInput) =>
    apiFetch(`${BASE_URL}/categorias/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),

  // Elimina una categoria por id.
  eliminar: (id: number) =>
    apiFetch(`${BASE_URL}/categorias/${id}`, { method: "DELETE" }).then(handle),
};
