const BASE_URL = "http://localhost:3001/api";

export interface Cita {
  id_cita: number;
  id_cliente: number;
  id_servicio: number;
  cliente: string;
  identificacion: string;
  servicio: string;
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

async function handle(res: Response) {
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Error de red");
  return json;
}

export const citasService = {
  getAll: (buscar = "", estado = "") =>
    fetch(
      `${BASE_URL}/citas?buscar=${encodeURIComponent(buscar)}&estado=${estado}`,
    ).then(handle),

  getById: (id: number) => fetch(`${BASE_URL}/citas/${id}`).then(handle),

  crear: (data: CitaInput) =>
    fetch(`${BASE_URL}/citas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),

  editar: (id: number, data: CitaInput) =>
    fetch(`${BASE_URL}/citas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),

  cambiarEstado: (id: number, estado: string) =>
    fetch(`${BASE_URL}/citas/${id}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    }).then(handle),

  eliminar: (id: number) =>
    fetch(`${BASE_URL}/citas/${id}`, { method: "DELETE" }).then(handle),
};
