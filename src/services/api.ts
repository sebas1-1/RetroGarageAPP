import axios from "axios";

// URL base para las llamadas hechas con Axios.
const API_URL = "http://192.168.100.23:3000/api";

// Cliente HTTP compartido: evita repetir URL, timeout y headers.
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
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
