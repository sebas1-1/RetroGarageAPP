import { apiFetch } from "./apiFetch";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://192.168.100.23:3001/api";

// Usuario administrativo que puede operar el sistema.
export interface Usuario {
  id_usuario: number;
  id_rol: number | null;
  rol: string | null;
  nombre_usuario: string | null;
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
  id_rol: number | null;
  nombre_usuario: string;
  nombre_completo: string;
  correo: string;
  telefono: string | null;
  contrasena?: string;
  respuesta1?: string;
  respuesta2?: string;
};

export type LoginInput = {
  usuario: string;
  contrasena: string;
};

export type VerificarOtpInput = {
  tempToken: string;
  codigo: string;
  metodo: "google" | "retrogarage";
};

export type SolicitarRecuperacionInput = {
  correo: string;
  pregunta: 1 | 2;
  respuesta: string;
};

export type ConfirmarRecuperacionInput = {
  correo: string;
  codigo: string;
  nueva_contrasena: string;
};

// Convierte la respuesta a JSON y muestra errores claros si algo falla.
async function handle(res: Response) {
  const json = await res.json();
  if (!res.ok) {
    const error = new Error(json.error || "Error de red") as Error & {
      status?: number;
      blockedUntil?: string;
      remainingSeconds?: number;
      attemptsRemaining?: number;
    };
    error.status = res.status;
    error.blockedUntil = json.blockedUntil;
    error.remainingSeconds = json.remainingSeconds;
    error.attemptsRemaining = json.attemptsRemaining;
    throw error;
  }
  return json;
}

// Servicio que comunica las pantallas de usuarios con la API.
export const usuariosService = {
  // Lista usuarios y permite buscar por texto.
  getAll: (buscar = "") =>
    apiFetch(
      `${BASE_URL}/usuarios${buscar ? `?buscar=${encodeURIComponent(buscar)}` : ""}`,
    ).then(handle),

  // Obtiene un usuario para editarlo.
  getById: (id: number) => apiFetch(`${BASE_URL}/usuarios/${id}`).then(handle),

  // Carga los roles disponibles para el formulario.
  getRoles: () => apiFetch(`${BASE_URL}/usuarios/roles`).then(handle),

  // Crea un usuario nuevo.
  crear: (data: UsuarioInput) =>
    apiFetch(`${BASE_URL}/usuarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),

  // Valida credenciales contra el backend.
  login: (data: LoginInput) =>
    apiFetch(`${BASE_URL}/usuarios/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),

  verificarOtp: (data: VerificarOtpInput) =>
    apiFetch(`${BASE_URL}/usuarios/login/otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),

  solicitarRecuperacion: (data: SolicitarRecuperacionInput) =>
    apiFetch(`${BASE_URL}/usuarios/recuperacion/solicitar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),

  confirmarRecuperacion: (data: ConfirmarRecuperacionInput) =>
    apiFetch(`${BASE_URL}/usuarios/recuperacion/confirmar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),

  // Actualiza datos de un usuario existente.
  editar: (id: number, data: UsuarioInput) =>
    apiFetch(`${BASE_URL}/usuarios/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),

  // Elimina un usuario por id.
  eliminar: (id: number) =>
    apiFetch(`${BASE_URL}/usuarios/${id}`, { method: "DELETE" }).then(handle),
};
