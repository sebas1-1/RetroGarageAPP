const BASE_URL = "http://localhost:3001/api";

// Cliente registrado en el taller.
export interface Cliente {
  id_cliente: number;
  nombre: string;
  apellido: string;
  identificacion: string;
  fecha_nacimiento: string | null;
  correo: string | null;
  telefono: string;
  provincia: string | null;
  canton: string | null;
  notas: string | null;
}

export type ClienteInput = Omit<Cliente, "id_cliente">;

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
    fetch(
      `${BASE_URL}/clientes${buscar ? `?buscar=${encodeURIComponent(buscar)}` : ""}`,
    ).then(handle),

  // Obtiene un cliente puntual para cargar el formulario de edicion.
  getById: (id: number) => fetch(`${BASE_URL}/clientes/${id}`).then(handle),

  // Registra un cliente nuevo.
  crear: (data: ClienteInput) =>
    fetch(`${BASE_URL}/clientes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),

  // Actualiza los datos de un cliente existente.
  editar: (id: number, data: ClienteInput) =>
    fetch(`${BASE_URL}/clientes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),

  // Elimina el cliente seleccionado.
  eliminar: (id: number) =>
    fetch(`${BASE_URL}/clientes/${id}`, { method: "DELETE" }).then(handle),
};
