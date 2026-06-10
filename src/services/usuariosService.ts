const BASE_URL = "http://localhost:3001/api";

export interface Usuario {
  id_usuario: number;
  id_rol: number;
  rol: string;
  nombre_completo: string;
  correo: string;
  telefono: string | null;
  activo: boolean;
  fecha_creacion: string;
  ultimo_acceso: string | null;
}

export interface Rol {
  id_rol: number;
  nombre: string;
}

export type UsuarioInput = {
  id_rol: number;
  nombre_completo: string;
  correo: string;
  telefono: string | null;
  contrasena?: string;
};

async function handle(res: Response) {
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Error de red");
  return json;
}

export const usuariosService = {
  getAll: (buscar = "") =>
    fetch(
      `${BASE_URL}/usuarios${buscar ? `?buscar=${encodeURIComponent(buscar)}` : ""}`,
    ).then(handle),

  getById: (id: number) => fetch(`${BASE_URL}/usuarios/${id}`).then(handle),

  getRoles: () => fetch(`${BASE_URL}/usuarios/roles`).then(handle),

  crear: (data: UsuarioInput) =>
    fetch(`${BASE_URL}/usuarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),

  editar: (id: number, data: UsuarioInput) =>
    fetch(`${BASE_URL}/usuarios/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),

  eliminar: (id: number) =>
    fetch(`${BASE_URL}/usuarios/${id}`, { method: "DELETE" }).then(handle),
};
