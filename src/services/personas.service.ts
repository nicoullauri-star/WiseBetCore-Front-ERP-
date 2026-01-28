
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
    fecha_nacimiento?: string;
    pais?: string;
    telefono?: string;
    correo_electronico?: string;
    direccion?: string;
    foto_rostro?: string | null;
    documento_frente?: string | null;
    documento_reverso?: string | null;
    fecha_registro?: string;
    activo: boolean;
    perfiles?: number[]; // IDs of assigned profiles
    nombre_completo?: string; // Optional helper
}

export interface CreatePersonaData {
    primer_nombre: string;
    segundo_nombre?: string;
    primer_apellido: string;
    segundo_apellido?: string;
    tipo_documento: string;
    numero_documento: string;
    fecha_nacimiento?: string;
    pais?: string;
    telefono?: string;
    correo_electronico?: string;
    direccion?: string;
    activo?: boolean;
}

export interface UpdatePersonaData extends Partial<CreatePersonaData> { }

export const personasService = {
    getAll: async () => {
        return await apiClient.get<PaginatedResponse<Persona>>(API_ENDPOINTS.PERSONAS);
    },

    search: async (query: string) => {
        return await apiClient.get<PaginatedResponse<Persona>>(API_ENDPOINTS.PERSONAS, {
            params: { search: query }
        });
    },

    create: async (data: CreatePersonaData) => {
        return await apiClient.post<Persona>(API_ENDPOINTS.PERSONAS, data);
    },

    update: async (id: number, data: UpdatePersonaData) => {
        return await apiClient.patch<Persona>(`${API_ENDPOINTS.PERSONAS}${id}/`, data);
    },

    remove: async (id: number) => {
        return await apiClient.delete(`${API_ENDPOINTS.PERSONAS}${id}/`);
    }
};
