const BASE_URL = "http://localhost:3001/api";

export interface Auto {
  id_auto?: number;
  identificacion: string;
  marca: string | null;
  modelo: string | null;
  anio: string | null;
  placa: string | null;
}

export type AutoInput = Omit<Auto, "id_auto">;

async function handle(res: Response) {
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Error de red");
  return json;
}

export const autosService = {
  getByIdentificacion: (identificacion: string) =>
    fetch(`${BASE_URL}/autos?identificacion=${encodeURIComponent(identificacion)}`).then(
      handle,
    ),

  crear: (data: AutoInput) =>
    fetch(`${BASE_URL}/autos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),

  reemplazarPorIdentificacion: (identificacion: string, autos: AutoInput[]) =>
    fetch(`${BASE_URL}/autos/cliente/${encodeURIComponent(identificacion)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ autos }),
    }).then(handle),
};
