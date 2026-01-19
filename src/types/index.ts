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

export type Deporte = 'FUTBOL' | 'BASKETBALL' | 'TENNIS' | 'BEISBOL' | 'HOCKEY' | 'ESPORTS';

export interface CasaApuestasSimple {
    id_casa: number;
    nombre: string;
    url_backoffice: string;
    activo: boolean;
}

export interface Distribuidora {
    id_distribuidora: number;
    nombre: string;
    deportes: Deporte[];
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
// ECOSYSTEM TYPE (Para compatibilidad con código existente)
// ============================================================================

export interface Ecosistema {
    id: string;
    name: string;
    houses: string[];
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
