const BASE_URL = "http://localhost:3001/api";

// Modelo de una cita tal como llega desde la API.
export interface Cita {
  id_cita: number;
  id_cliente: number;
  id_servicio: number;
  cliente: string;
  identificacion: string;
  servicio: string;
  precio_base?: number;
  marca_vehiculo: string;
  modelo_vehiculo: string;
  anio_vehiculo: number | null;
  fecha: string;
  hora: string;
  descripcion: string | null;
  estado: "PENDIENTE" | "COMPLETADA" | "CANCELADA";
  fecha_registro: string;
}

export type CitaInput = {
  id_cliente: number;
  id_servicio: number;
  marca_vehiculo: string;
  modelo_vehiculo: string;
  anio_vehiculo: number | null;
  fecha: string;
  hora: string;
  descripcion: string | null;
  estado: string;
};

// Lee la respuesta del backend y lanza un error si la API respondio mal.
async function handle(res: Response) {
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Error de red");
  return json;
}

// Funciones que usan las pantallas para consultar y modificar citas.
export const citasService = {
  // Lista citas y permite filtrar por texto o estado.
  getAll: (buscar = "", estado = "") =>
    fetch(
      `${BASE_URL}/citas?buscar=${encodeURIComponent(buscar)}&estado=${estado}`,
    ).then(handle),

  // Obtiene una cita especifica para editarla o ver su detalle.
  getById: (id: number) => fetch(`${BASE_URL}/citas/${id}`).then(handle),

  // Crea una nueva cita en la base de datos.
  crear: (data: CitaInput) =>
    fetch(`${BASE_URL}/citas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),

  // Actualiza todos los datos editables de una cita.
  editar: (id: number, data: CitaInput) =>
    fetch(`${BASE_URL}/citas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),

  // Cambia solo el estado sin tocar el resto de la cita.
  cambiarEstado: (id: number, estado: string) =>
    fetch(`${BASE_URL}/citas/${id}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    }).then(handle),

  // Elimina una cita por su identificador.
  eliminar: (id: number) =>
    fetch(`${BASE_URL}/citas/${id}`, { method: "DELETE" }).then(handle),
};
