/**
 * Objetivos Service
 * Servicio para operaciones CRUD de Objetivos de Creación de Perfiles
 */

import { apiClient } from './api.client';
import type { 
    PaginatedResponse, 
    ObjetivoPerfiles, 
    CreateObjetivoData,
    CalendarioEvento,
    HistorialAgencia,
    PlanificarData,
    AlertaPlanificacion
} from '../types';

// ============================================================================
// TYPES
// ============================================================================

export type { CreateObjetivoData, PlanificarData };

export interface GetObjetivosParams {
    agencia?: number;
    completado?: boolean;
    page?: number;
    page_size?: number;
}

export interface EstadisticasObjetivos {
    total_objetivos: number;
    objetivos_completados: number;
    objetivos_pendientes: number;
    total_perfiles_objetivo: number;
    total_perfiles_completados: number;
}

// ============================================================================
// SERVICE
// ============================================================================

const BASE_URL = '/api/gestion-operativa/objetivos-perfiles';

export const objetivosService = {
    /**
     * Obtiene lista de objetivos (paginada)
     */
    async getAll(params?: GetObjetivosParams): Promise<PaginatedResponse<ObjetivoPerfiles>> {
        return apiClient.get<PaginatedResponse<ObjetivoPerfiles>>(
            `${BASE_URL}/`,
            { params: params as Record<string, string | number | boolean> }
        );
    },

    /**
     * Obtiene un objetivo por ID
     */
    async getById(id: number): Promise<ObjetivoPerfiles> {
        const endpoint = `${BASE_URL}/${id}/`;
        return apiClient.get<ObjetivoPerfiles>(endpoint);
    },

    /**
     * Crea un nuevo objetivo
     */
    async create(data: CreateObjetivoData): Promise<ObjetivoPerfiles> {
        return apiClient.post<ObjetivoPerfiles>(`${BASE_URL}/`, data);
    },

    /**
     * Actualiza un objetivo existente
     */
    async update(id: number, data: Partial<CreateObjetivoData>): Promise<ObjetivoPerfiles> {
        const endpoint = `${BASE_URL}/${id}/`;
        return apiClient.patch<ObjetivoPerfiles>(endpoint, data);
    },

    /**
     * Elimina un objetivo
     */
    async delete(id: number): Promise<void> {
        const endpoint = `${BASE_URL}/${id}/`;
        return apiClient.delete(endpoint);
    },

    // ========================================================================
    // ENDPOINTS PERSONALIZADOS
    // ========================================================================

    /**
     * Obtiene objetivos NO completados
     */
    async getPendientes(): Promise<ObjetivoPerfiles[]> {
        const endpoint = `${BASE_URL}/pendientes/`;
        return apiClient.get<ObjetivoPerfiles[]>(endpoint);
    },

    /**
     * Obtiene estadísticas generales
     */
    async getEstadisticas(): Promise<EstadisticasObjetivos> {
        const endpoint = `${BASE_URL}/estadisticas/`;
        return apiClient.get<EstadisticasObjetivos>(endpoint);
    },

    /**
     * Obtiene eventos para calendario gráfico (incluye tipo 'planificado')
     */
    async getCalendarioEventos(): Promise<CalendarioEvento[]> {
        const endpoint = `${BASE_URL}/calendario_eventos/`;
        return apiClient.get<CalendarioEvento[]>(endpoint);
    },

    /**
     * Obtiene historial completo de una agencia (objetivos + perfiles)
     */
    async getHistorialByAgencia(agenciaId: number): Promise<HistorialAgencia> {
        const endpoint = `${BASE_URL}/historial-por-agencia/`;
        return apiClient.get<HistorialAgencia>(endpoint, {
            params: { agencia_id: agenciaId }
        });
    },

    // ========================================================================
    // PLANIFICACIÓN
    // ========================================================================

    /**
     * Asigna planificación a un objetivo (fecha + cantidad)
     * @param objetivoId ID del objetivo
     * @param data { fecha: "YYYY-MM-DD", cantidad: number }
     */
    async planificar(objetivoId: number, data: PlanificarData): Promise<ObjetivoPerfiles> {
        const endpoint = `${BASE_URL}/${objetivoId}/planificar/`;
        return apiClient.patch<ObjetivoPerfiles>(endpoint, data);
    },

    /**
     * Obtiene alertas de planificación calculadas (timezone: America/Guayaquil)
     * Tipos: SIN_PLANIFICAR, HOY, MAÑANA, VENCIDO
     */
    async getAlertas(): Promise<AlertaPlanificacion[]> {
        const endpoint = `${BASE_URL}/alertas/`;
        return apiClient.get<AlertaPlanificacion[]>(endpoint);
    },
};
