const BASE_URL = "http://localhost:3001/api";

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

async function handle(res: Response) {
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Error de red");
  return json;
}

export const categoriasService = {
  getAll: () => fetch(`${BASE_URL}/categorias`).then(handle),

  crear: (data: CategoriaInput) =>
    fetch(`${BASE_URL}/categorias`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),

  editar: (id: number, data: CategoriaInput) =>
    fetch(`${BASE_URL}/categorias/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),

  eliminar: (id: number) =>
    fetch(`${BASE_URL}/categorias/${id}`, { method: "DELETE" }).then(handle),
};
