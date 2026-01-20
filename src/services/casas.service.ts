/**
 * Casas Apuestas Service
 * Servicio para operaciones CRUD de Casas de Apuestas
 */

import { apiClient } from './api.client';
import { API_ENDPOINTS } from '../config/api.config';
import type { PaginatedResponse, CasaApuestas } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface GetCasasParams {
    page?: number;
    page_size?: number;
    distribuidora?: number;
    activo?: boolean;
}

export interface CreateCasaData {
    distribuidora: number;
    nombre: string;
    url_backoffice?: string;
    perfiles_minimos_req?: number;
    activo?: boolean;
}

export interface UpdateCasaData extends Partial<CreateCasaData> { }

// ============================================================================
// SERVICE
// ============================================================================

export const casasService = {
    /**
     * Obtiene lista de casas (paginada)
     */
    async getAll(params?: GetCasasParams): Promise<PaginatedResponse<CasaApuestas>> {
        return apiClient.get<PaginatedResponse<CasaApuestas>>(
            API_ENDPOINTS.CASAS_APUESTAS || '/casas-apuestas/',
            { params: params as Record<string, string | number | boolean> }
        );
    },

    /**
     * Obtiene una casa por ID
     */
    async getById(id: number): Promise<CasaApuestas> {
        const endpoint = `${API_ENDPOINTS.CASAS_APUESTAS || '/casas-apuestas/'}${id}/`;
        return apiClient.get(endpoint);
    },

    /**
     * Crea una nueva casa
     */
    async create(data: CreateCasaData): Promise<CasaApuestas> {
        return apiClient.post<CasaApuestas>(API_ENDPOINTS.CASAS_APUESTAS || '/casas-apuestas/', data);
    },

    /**
     * Actualiza una casa existente
     */
    async update(id: number, data: UpdateCasaData): Promise<CasaApuestas> {
        const endpoint = `${API_ENDPOINTS.CASAS_APUESTAS || '/casas-apuestas/'}${id}/`;
        return apiClient.patch<CasaApuestas>(endpoint, data);
    },

    /**
     * Elimina una casa
     */
    async delete(id: number): Promise<void> {
        const endpoint = `${API_ENDPOINTS.CASAS_APUESTAS || '/casas-apuestas/'}${id}/`;
        return apiClient.delete(endpoint);
    },
};
