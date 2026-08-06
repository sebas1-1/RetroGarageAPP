import { API_BASE_URL } from "../config/api";
import { apiFetch } from "./apiFetch";

// Cliente registrado en el taller.
export interface Cliente {
  id_cliente: number;
  nombre: string;
  apellido: string;
  identificacion: string;
  fecha_nacimiento: string | null;
  correo: string | null;
  telefono: string;
  id_pais: number | null;
  id_provincia: number | null;
  id_canton: number | null;
  id_distrito: number | null;
  provincia: string | null;
  canton: string | null;
  distrito: string | null;
  pais: string | null;
  notas: string | null;
}

export type ClienteInput = Pick<Cliente, "nombre" | "apellido" | "identificacion" | "fecha_nacimiento" | "correo" | "telefono" | "id_distrito" | "notas">;

// Convierte la respuesta HTTP en JSON y centraliza el manejo de errores.
async function handle(res: Response) {
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Error de red");
  return json;
}

// Operaciones de clientes usadas por las pantallas de listado, nuevo y editar.
export const clientesService = {
  // Lista clientes y permite buscar por texto.
  getAll: (buscar = "") =>
    apiFetch(
      `${API_BASE_URL}/clientes${buscar ? `?buscar=${encodeURIComponent(buscar)}` : ""}`,
    ).then(handle),

  // Obtiene un cliente puntual para cargar el formulario de edicion.
  getById: (id: number) => apiFetch(`${API_BASE_URL}/clientes/${id}`).then(handle),

  // Registra un cliente nuevo.
  crear: (data: ClienteInput) =>
    apiFetch(`${API_BASE_URL}/clientes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),

  // Actualiza los datos de un cliente existente.
  editar: (id: number, data: ClienteInput) =>
    apiFetch(`${API_BASE_URL}/clientes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),

  // Elimina el cliente seleccionado.
  eliminar: (id: number) =>
    apiFetch(`${API_BASE_URL}/clientes/${id}`, { method: "DELETE" }).then(handle),
};
