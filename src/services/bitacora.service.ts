import { apiClient } from './api.client';
import { API_ENDPOINTS } from '../config/api.config';
import type { PaginatedResponse } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface NotaBitacora {
    id: number;
    perfil: number; // ID del perfil operativo
    contenido: string;
    autor_nombre?: string; // Read-only from backend
    created_at: string;
    updated_at: string;
}

export interface GetNotasParams {
    page?: number;
    page_size?: number;
    perfil?: number;
    search?: string;
    ordering?: string; // e.g. -created_at
}

export interface CreateNotaData {
    perfil: number;
    contenido: string;
}

export interface UpdateNotaData {
    contenido: string;
}

// ============================================================================
// SERVICE
// ============================================================================

export const bitacoraService = {
    /**
     * Obtiene lista de notas de bitácora
     */
    async getAll(params?: GetNotasParams): Promise<PaginatedResponse<NotaBitacora>> {
        // Fallback endpoint if not in centralized config yet
        // Assuming endpoint follows convention /gestion-operativa/bitacora/ or similar based on request context 
        // User request mentioned "BitacoraOperativa" but didn't specify URL exactly, assuming standard DRF pattern
        // I will use /gestion-operativa/bitacora/ as default
        const endpoint = API_ENDPOINTS.BITACORA || '/gestion-operativa/bitacora/';
        return await apiClient.get<PaginatedResponse<NotaBitacora>>(endpoint, {
            params: params as Record<string, string | number | boolean>
        });
    },

    /**
     * Crea una nueva nota en la bitácora
     */
    async create(data: CreateNotaData): Promise<NotaBitacora> {
        const endpoint = API_ENDPOINTS.BITACORA || '/gestion-operativa/bitacora/';
        return await apiClient.post<NotaBitacora>(endpoint, data);
    },

    /**
     * Actualiza una nota existente
     */
    async update(id: number, data: UpdateNotaData): Promise<NotaBitacora> {
        const endpoint = API_ENDPOINTS.BITACORA || '/gestion-operativa/bitacora/';
        return await apiClient.patch<NotaBitacora>(`${endpoint}${id}/`, data);
    },

    /**
     * Elimina una nota
     */
    async delete(id: number): Promise<void> {
        const endpoint = API_ENDPOINTS.BITACORA || '/gestion-operativa/bitacora/';
        return await apiClient.delete(`${endpoint}${id}/`);
    }
};
