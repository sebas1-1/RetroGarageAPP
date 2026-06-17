const BASE_URL = "http://localhost:3001/api";

// Usuario administrativo que puede operar el sistema.
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

// Rol usado para definir permisos o tipo de usuario.
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

// Convierte la respuesta a JSON y muestra errores claros si algo falla.
async function handle(res: Response) {
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Error de red");
  return json;
}

// Servicio que comunica las pantallas de usuarios con la API.
export const usuariosService = {
  // Lista usuarios y permite buscar por texto.
  getAll: (buscar = "") =>
    fetch(
      `${BASE_URL}/usuarios${buscar ? `?buscar=${encodeURIComponent(buscar)}` : ""}`,
    ).then(handle),

  // Obtiene un usuario para editarlo.
  getById: (id: number) => fetch(`${BASE_URL}/usuarios/${id}`).then(handle),

  // Carga los roles disponibles para el formulario.
  getRoles: () => fetch(`${BASE_URL}/usuarios/roles`).then(handle),

  // Crea un usuario nuevo.
  crear: (data: UsuarioInput) =>
    fetch(`${BASE_URL}/usuarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),

  // Actualiza datos de un usuario existente.
  editar: (id: number, data: UsuarioInput) =>
    fetch(`${BASE_URL}/usuarios/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),

  // Elimina un usuario por id.
  eliminar: (id: number) =>
    fetch(`${BASE_URL}/usuarios/${id}`, { method: "DELETE" }).then(handle),
};
