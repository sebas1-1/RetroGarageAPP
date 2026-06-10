import { create } from "zustand";
import { Cliente } from "../types";
import { clientesService } from "../services/clientesService";

interface ClientesStore {
  clientes: Cliente[];
  clienteSeleccionado: Cliente | null;
  cargando: boolean;
  error: string | null;

  getClientes: () => Promise<void>;
  getCliente: (id: number) => Promise<void>;
  crearCliente: (cliente: Omit<Cliente, "id_cliente" | "fecha_registro">) => Promise<void>;
  actualizarCliente: (id: number, cliente: Partial<Cliente>) => Promise<void>;
  eliminarCliente: (id: number) => Promise<void>;
  limpiarError: () => void;
}

export const useClientesStore = create<ClientesStore>((set) => ({
  clientes: [],
  clienteSeleccionado: null,
  cargando: false,
  error: null,

  getClientes: async () => {
    set({ cargando: true, error: null });
    try {
      const data = await clientesService.getAll();
      set({ clientes: data, cargando: false });
    } catch (error) {
      set({ error: "Error al cargar clientes", cargando: false });
    }
  },

  getCliente: async (id) => {
    set({ cargando: true, error: null });
    try {
      const data = await clientesService.getById(id);
      set({ clienteSeleccionado: data, cargando: false });
    } catch (error) {
      set({ error: "Error al cargar cliente", cargando: false });
    }
  },

  crearCliente: async (cliente) => {
    set({ cargando: true, error: null });
    try {
      await clientesService.create(cliente);
      set({ cargando: false });
    } catch (error) {
      set({ error: "Error al crear cliente", cargando: false });
    }
  },

  actualizarCliente: async (id, cliente) => {
    set({ cargando: true, error: null });
    try {
      await clientesService.update(id, cliente);
      set({ cargando: false });
    } catch (error) {
      set({ error: "Error al actualizar cliente", cargando: false });
    }
  },

  eliminarCliente: async (id) => {
    set({ cargando: true, error: null });
    try {
      await clientesService.delete(id);
      set((state) => ({
        clientes: state.clientes.filter((c) => c.id_cliente !== id),
        cargando: false,
      }));
    } catch (error) {
      set({ error: "Error al eliminar cliente", cargando: false });
    }
  },

  limpiarError: () => set({ error: null }),
}));