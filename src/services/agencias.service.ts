/**
 * Agencias Service
 * Servicio para operaciones CRUD de Agencias (Flota Operativa)
 */

import { apiClient } from './api.client';
import { API_ENDPOINTS } from '../config/api.config';
import type { PaginatedResponse, Agencia, CreateAgenciaData, UpdateAgenciaData } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export type { CreateAgenciaData, UpdateAgenciaData };

export interface GetAgenciasParams {
    page?: number;
    page_size?: number;
    casa_madre?: number;
    activo?: boolean;
    search?: string;
}

// ============================================================================
// SERVICE
// ============================================================================

export const agenciasService = {
    /**
     * Obtiene lista de agencias (paginada)
     */
    async getAll(params?: GetAgenciasParams): Promise<PaginatedResponse<Agencia>> {
        return apiClient.get<PaginatedResponse<Agencia>>(
            API_ENDPOINTS.AGENCIAS,
            { params: params as Record<string, string | number | boolean> }
        );
    },

    /**
     * Obtiene una agencia por ID
     */
    async getById(id: number): Promise<Agencia> {
        const endpoint = `${API_ENDPOINTS.AGENCIAS}${id}/`;
        return apiClient.get(endpoint);
    },

    /**
     * Crea una nueva agencia
     */
    async create(data: CreateAgenciaData): Promise<Agencia> {
        return apiClient.post<Agencia>(API_ENDPOINTS.AGENCIAS, data);
    },

    /**
     * Actualiza una agencia existente
     */
    async update(id: number, data: UpdateAgenciaData): Promise<Agencia> {
        const endpoint = `${API_ENDPOINTS.AGENCIAS}${id}/`;
        return apiClient.patch<Agencia>(endpoint, data);
    },

    /**
     * Elimina una agencia
     */
    async delete(id: number): Promise<void> {
        const endpoint = `${API_ENDPOINTS.AGENCIAS}${id}/`;
        return apiClient.delete(endpoint);
    },
};
