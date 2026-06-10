// ── SEGURIDAD ──────────────────────────────────
export interface Rol {
  id_rol: number;
  nombre: string;
  descripcion: string;
}

export interface Usuario {
  id_usuario: number;
  id_rol: number;
  nombre_completo: string;
  correo: string;
  telefono: string;
  contrasena_hash: string;
  activo: boolean;
  fecha_creacion: string;
  ultimo_acceso: string;
}

// ── CLIENTES ───────────────────────────────────
export interface Cliente {
  id_cliente: number;
  nombre: string;
  apellido: string;
  identificacion: string;
  fecha_nacimiento: string;
  correo: string;
  telefono: string;
  provincia: string;
  canton: string;
  notas: string;
  activo: boolean;
  fecha_registro: string;
}

// ── CATÁLOGOS ──────────────────────────────────
export interface Categoria {
  id_categoria: number;
  nombre: string;
  tipo: string; // 'Producto' | 'Servicio'
  descripcion: string;
  activo: boolean;
}

export interface Servicio {
  id_servicio: number;
  id_categoria: number;
  nombre: string;
  precio_base: number;
  activo: boolean;
}

// ── INVENTARIO ─────────────────────────────────
export interface Producto {
  id_producto: number;
  id_categoria: number;
  nombre: string;
  codigo_item: string;
  precio_venta: number;
  precio_costo: number;
  stock_actual: number;
  stock_minimo: number;
  unidad_medida: string;
  proveedor: string;
  activo: boolean;
}

// ── CITAS ──────────────────────────────────────
export interface Cita {
  id_cita: number;
  id_cliente: number;
  id_servicio: number;
  marca_vehiculo: string;
  modelo_vehiculo: string;
  anio_vehiculo: number;
  fecha: string;
  hora: string;
  descripcion: string;
  estado: string; // PENDIENTE | COMPLETADA | CANCELADA
  fecha_registro: string;
}

// ── PAGOS ──────────────────────────────────────
export interface MetodoPago {
  id_metodo: number;
  nombre: string;
  requiere_referencia: boolean;
  activo: boolean;
}

export interface Pago {
  id_pago: number;
  numero_factura: string;
  id_cita: number;
  id_usuario: number;
  id_metodo: number;
  monto: number;
  monto_recibido: number;
  cambio: number;
  numero_referencia: string;
  banco: string;
  observaciones: string;
  estado_pago: string;
  fecha_pago: string;
}

// ── INVENTARIO MOVIMIENTOS ─────────────────────
export interface MovimientoInventario {
  id_movimiento: number;
  id_producto: number;
  id_cita: number;
  id_usuario: number;
  tipo: string; // entrada | salida | ajuste
  cantidad: number;
  stock_anterior: number;
  stock_resultante: number;
  motivo: string;
  fecha: string;
}