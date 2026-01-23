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
