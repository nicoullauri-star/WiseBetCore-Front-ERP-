/**
 * WiseBet API Types
 * Interfaces TypeScript que mapean a los modelos del backend
 */

// ============================================================================
// BASE TYPES
// ============================================================================

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

// ============================================================================
// DISTRIBUIDORAS (FLOTAS)
// ============================================================================

export interface Deporte {
    id_deporte: number;
    codigo: string;
    nombre: string;
    activo: boolean;
}

export interface CasaApuestasSimple {
    id_casa: number;
    nombre: string;
    url_backoffice: string;
    activo: boolean;
}

export interface Distribuidora {
    id_distribuidora: number;
    nombre: string;
    deportes: number[];
    deportes_detalle: Deporte[];
    descripcion: string | null;
    activo: boolean;
    casas_count: number;
    fecha_creacion: string;
    fecha_actualizacion: string;
}

export interface DistribuidoraExpanded extends Distribuidora {
    casas: CasaApuestasSimple[];
}

// ============================================================================
// CASAS DE APUESTAS
// ============================================================================

export interface CasaApuestas {
    id_casa: number;
    distribuidora: number;
    distribuidora_nombre: string;
    nombre: string;
    nro_perfiles: number;
    url_backoffice: string;
    capital_activo_hoy: string; // Decimal as string
    capital_total: string;
    perfiles_minimos_req: number;
    activo: boolean;
    fecha_creacion: string;
    fecha_actualizacion: string;
}

// ============================================================================
// AGENCIAS
// ============================================================================

export interface Agencia {
    id_agencia: number;
    nombre: string;
    // ubicacion?: number | null; // Placeholder for future
    responsable: string;
    contacto?: string;
    email?: string;
    casa_madre: number; // ID of CasaApuestas
    casa_madre_nombre?: string; // Read-only from backend serializer likely
    rake_porcentaje: number; // Decimal
    perfiles_totales: number;
    url_backoffice?: string;
    activo: boolean;
    tiene_arrastre?: boolean;
    fecha_registro: string;
}

export interface CreateAgenciaData {
    nombre: string;
    responsable: string;
    contacto?: string;
    email?: string;
    casa_madre: number;
    rake_porcentaje?: number;
    url_backoffice?: string;
    activo?: boolean;
    tiene_arrastre?: boolean;
}

export interface UpdateAgenciaData extends Partial<CreateAgenciaData> { }

// ============================================================================
// OBJETIVOS DE CREACIÓN DE PERFILES
// ============================================================================

/** Estructura del campo planificacion: {"YYYY-MM-DD": cantidad} */
export type PlanificacionJSON = Record<string, number>;

export interface ObjetivoPerfiles {
    id_objetivo: number;
    agencia: number;
    agencia_nombre: string;
    cantidad_objetivo: number;
    cantidad_completada: number;
    plazo_dias: number;
    fecha_inicio: string;
    fecha_limite: string;
    estado_inicial_perfiles: 'ACTIVO' | 'INACTIVO';
    completado: boolean;
    perfiles_restantes: number;
    porcentaje_completado: number;
    planificacion: PlanificacionJSON; // Nuevo campo
    fecha_creacion: string;
    fecha_actualizacion: string;
}

export interface CreateObjetivoData {
    agencia: number;
    cantidad_objetivo: number;
    plazo_dias: number;
    estado_inicial_perfiles: 'ACTIVO' | 'INACTIVO';
}

export interface PlanificarData {
    fecha: string;
    cantidad: number;
}

export interface MoverPlanificacionData {
    fecha_origen: string;
    fecha_destino: string;
}

export interface CalendarioEvento {
    id: string;
    tipo: 'fecha_limite' | 'perfil_creado' | 'planificado';
    titulo: string;
    agencia_id: number;
    agencia_nombre: string;
    fecha: string;
    fecha_inicio?: string;
    hora?: string;
    cantidad_objetivo?: number;
    cantidad_completada?: number;
    perfiles_restantes?: number;
    completado?: boolean;
    nombre_usuario?: string;
    tipo_jugador?: string;
    // Campos para tipo 'planificado'
    cantidad_planificada?: number;
    cantidad_creada?: number;
    objetivo_id?: number;
    color: 'red' | 'green' | 'blue' | 'purple';
}

// ============================================================================
// ALERTAS DE PLANIFICACIÓN
// ============================================================================

export type AlertaTipo = 
    | 'SIN_PLANIFICAR' 
    | 'HOY' 
    | 'MAÑANA' 
    | 'VENCIDO'
    | 'FALTAN_3_DIAS'
    | 'FALTAN_2_DIAS'
    | 'FALTAN_1_DIA';

export interface AlertaPlanificacion {
    tipo: AlertaTipo;
    objetivo_id: number;
    agencia_id: number;
    agencia_nombre: string;
    mensaje: string;
    // Campos para SIN_PLANIFICAR
    faltantes_por_planificar?: number;
    // Campos para HOY y MAÑANA
    fecha?: string;
    cantidad?: number;
    creados_hoy?: number;
    pendientes?: number;
    // Campos para FALTAN_X_DIAS y VENCIDO
    fecha_limite?: string;
    dias_restantes?: number;
    dias_vencido?: number;
    perfiles_restantes?: number;
}

export interface PerfilCreadoResumen {
    id_perfil: number;
    nombre_usuario: string;
    fecha_creacion: string | null;
    tipo_jugador: string;
    nivel_cuenta: string;
    activo: boolean;
}

export interface HistorialAgencia {
    agencia_id: number;
    objetivos: ObjetivoPerfiles[];
    perfiles_creados: PerfilCreadoResumen[];
}

// ============================================================================
// ECOSYSTEM TYPE (Para compatibilidad con código existente)
// ============================================================================

export interface Ecosistema {
    id: string;
    name: string;
    houses: any[]; // houses with full data when available
}

/**
 * Transforma distribuidoras del backend al formato Ecosistema del frontend
 */
export function distribuidoraToEcosistema(dist: DistribuidoraExpanded): Ecosistema {
    return {
        id: dist.id_distribuidora.toString(),
        name: dist.nombre,
        houses: dist.casas.map(c => c.nombre)
    };
}
