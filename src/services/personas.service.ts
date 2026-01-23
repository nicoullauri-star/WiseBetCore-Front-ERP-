
import { apiClient } from './api.client';
import { API_ENDPOINTS } from '../config/api.config';
import type { PaginatedResponse } from '../types';

export interface Persona {
    id_persona: number;
    primer_nombre: string;
    segundo_nombre: string | null;
    primer_apellido: string;
    segundo_apellido: string | null;
    tipo_documento: string;
    numero_documento: string;
    nombre_completo?: string; // Generated on frontend or backed if property
}

export const personasService = {
    getAll: async () => {
        return await apiClient.get<PaginatedResponse<Persona>>(API_ENDPOINTS.PERSONAS);
    },

    search: async (query: string) => {
        return await apiClient.get<PaginatedResponse<Persona>>(API_ENDPOINTS.PERSONAS, {
            params: { documento: query }
        });
    }
};
