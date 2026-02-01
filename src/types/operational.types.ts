export interface Deporte {
    id_deporte: number;
    codigo: string;
    nombre: string;
    slug_flashscore: string;
    activo: boolean;
}

export interface Competicion {
    id_competicion: number;
    nombre: string;
    codigo: string;
    tipo: 'INTERNACIONAL' | 'LIGA' | 'COPA' | 'AMISTOSO';
    deporte_nombre: string;
    pais_nombre: string | null;
    orden: number;
}

export interface Distribuidora {
    id_distribuidora: number;
    nombre: string;
    activo: boolean;
}

export interface ManualPickPayload {
    orden: number;
    deporte: number; // ID
    competicion: number; // ID
    partido: string;
    link_partido?: string;
    fecha_evento: string; // ISO
    mercado: string;
    seleccion: string;
    cuota_pick: number;
}

export interface CreateSenalPayload {
    tipo_apuesta: 'SENCILLA' | 'COMBINADA';
    cuota_fair: number;
    cuota_fair_black?: string;
    cuota_total: number;
    cuota_minima: number;
    stake_recomendado: number;
    distribuidora?: number; // ID
    origen: 'MANUAL';
    notas?: string;
    picks: ManualPickPayload[];
}

export interface SenalResponse {
    id_senal: number;
    tipo_apuesta: 'SENCILLA' | 'COMBINADA';
    sport: string;
    league: string;
    startTime: string; // HH:mm
    startDateTime: string; // ISO
    event: string;
    market: string;
    selection: string;
    fairOdd: number | string; // Backend might send string or number
    cuotaFairBlack?: string;
    minOdd: number | string;
    recommendedStake: number | string;
    placedStake: number | string;
    distribuidora_nombre?: string;
    status: 'NEW' | 'PARTIAL' | 'PLACED' | 'WAITING_LIVE' | 'EXPIRED' | 'BLOCKED';
    isLive: boolean;
    source: string;
    receivedAt: string;
    notas?: string;
    picks?: any[]; // For detailed view if needed
}

export interface CreateOperationPayload {
    senal: number;
    perfil: number;
    casa_apuestas: number;
    monto: number;
    cuota: number;
    status?: 'PENDING' | 'WIN' | 'LOSS' | 'PUSH';
}

export interface OperationResponse {
    id_operacion: number;
    senal: number;
    perfil: number;
    monto: number;
    cuota: number;
    status: string;
    created_at: string;
}
