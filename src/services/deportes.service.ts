/**
 * Deportes Service
 * Servicio para obtener catálogo de deportes
 */

import { apiClient } from './api.client';
import { API_ENDPOINTS } from '../config/api.config';
import type { Deporte, PaginatedResponse } from '../types';

export const deportesService = {
    /**
     * Obtiene todos los deportes activos
     */
    async getAll(): Promise<PaginatedResponse<Deporte>> {
        return apiClient.get<PaginatedResponse<Deporte>>(API_ENDPOINTS.DEPORTES);
    }
};
