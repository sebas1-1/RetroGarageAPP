import { create } from "axios";
import { API_BASE_URL } from "../config/api";

// Cliente HTTP compartido: evita repetir URL, timeout y headers.
const api = create({
  baseURL: API_BASE_URL,
  // Render Free puede tardar en despertar después de un periodo sin uso.
  timeout: 75000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor de salida: aqui se podrian agregar tokens o datos de sesion.
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de entrada: deja pasar respuestas correctas y registra errores.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log("Error API:", error.message);
    return Promise.reject(error);
  }
);

// Exporta el cliente listo para usar en cualquier servicio.
export default api;
