import { API_BASE_URL } from "../config/api";
import { apiFetch } from "./apiFetch";

export type OpcionGeografica = {
  id: number;
  descripcion: string;
};

async function handle(res: Response) {
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Error al cargar ubicaciones");
  return json;
}

export const geografiaService = {
  getPaises: (): Promise<OpcionGeografica[]> =>
    apiFetch(`${API_BASE_URL}/geografia/paises`).then(handle),
  getProvincias: (idPais: number): Promise<OpcionGeografica[]> =>
    apiFetch(`${API_BASE_URL}/geografia/paises/${idPais}/provincias`).then(handle),
  getCantones: (idProvincia: number): Promise<OpcionGeografica[]> =>
    apiFetch(`${API_BASE_URL}/geografia/provincias/${idProvincia}/cantones`).then(handle),
  getDistritos: (idCanton: number): Promise<OpcionGeografica[]> =>
    apiFetch(`${API_BASE_URL}/geografia/cantones/${idCanton}/distritos`).then(handle),
};
