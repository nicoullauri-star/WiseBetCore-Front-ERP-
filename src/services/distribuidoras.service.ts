/**
 * Distribuidoras Service
 * Servicio para operaciones CRUD de Distribuidoras (Flotas)
 */

import { apiClient } from './api.client';
import { API_ENDPOINTS } from '../config/api.config';
import type {
    Distribuidora,
    DistribuidoraExpanded,
    PaginatedResponse,
    Ecosistema,
    distribuidoraToEcosistema
} from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface GetDistribuidorasParams {
    page?: number;
    page_size?: number;
    expand?: 'casas';
    activo?: boolean;
}

export interface CreateDistribuidoraData {
    nombre: string;
    deportes: number[];
    descripcion?: string;
    activo?: boolean;
}

export interface UpdateDistribuidoraData extends Partial<CreateDistribuidoraData> { }

// ============================================================================
// SERVICE
// ============================================================================

export const distribuidorasService = {
    /**
     * Obtiene lista de distribuidoras (paginada)
     */
    async getAll(params?: GetDistribuidorasParams): Promise<PaginatedResponse<Distribuidora>> {
        return apiClient.get<PaginatedResponse<Distribuidora>>(
            API_ENDPOINTS.DISTRIBUIDORAS,
            { params: params as Record<string, string | number | boolean> }
        );
    },

    /**
     * Obtiene lista de distribuidoras con casas anidadas
     */
    async getAllWithCasas(params?: Omit<GetDistribuidorasParams, 'expand'>): Promise<PaginatedResponse<DistribuidoraExpanded>> {
        return apiClient.get<PaginatedResponse<DistribuidoraExpanded>>(
            API_ENDPOINTS.DISTRIBUIDORAS,
            { params: { ...params, expand: 'casas' } as Record<string, string | number | boolean> }
        );
    },

    /**
     * Obtiene una distribuidora por ID
     */
    async getById(id: number, expand?: 'casas'): Promise<Distribuidora | DistribuidoraExpanded> {
        const endpoint = `${API_ENDPOINTS.DISTRIBUIDORAS}${id}/`;
        return apiClient.get(endpoint, { params: expand ? { expand } : undefined });
    },

    /**
     * Crea una nueva distribuidora
     */
    async create(data: CreateDistribuidoraData): Promise<Distribuidora> {
        return apiClient.post<Distribuidora>(API_ENDPOINTS.DISTRIBUIDORAS, data);
    },

    /**
     * Actualiza una distribuidora existente
     */
    async update(id: number, data: UpdateDistribuidoraData): Promise<Distribuidora> {
        const endpoint = `${API_ENDPOINTS.DISTRIBUIDORAS}${id}/`;
        return apiClient.patch<Distribuidora>(endpoint, data);
    },

    /**
     * Elimina una distribuidora
     */
    async delete(id: number): Promise<void> {
        const endpoint = `${API_ENDPOINTS.DISTRIBUIDORAS}${id}/`;
        return apiClient.delete(endpoint);
    },

    /**
     * Obtiene todas las distribuidoras formateadas como Ecosistemas
     * (Para compatibilidad con el código existente del frontend)
     */
    async getAllAsEcosistemas(): Promise<Ecosistema[]> {
        const response = await this.getAllWithCasas({ page_size: 100 });
        return response.results.map(dist => ({
            id: dist.id_distribuidora.toString(),
            name: dist.nombre,
            houses: dist.casas.map(c => c.nombre)
        }));
    },
};
