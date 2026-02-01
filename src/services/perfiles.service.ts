
import { apiClient } from './api.client';
import { API_ENDPOINTS } from '../config/api.config';
import type { PaginatedResponse } from '../types';

export interface PerfilOperativo {
    id_perfil: number;
    usuario: number; // ID of the User
    persona: number; // ID of the Persona
    agencia: number; // ID of the Agencia
    url_acceso_backoffice?: string;
    nombre_usuario: string; // "user_pro_..."
    tipo_jugador: string;
    deporte_dna: number | null;
    ip_operativa: string;
    preferencias: string;
    nivel_cuenta: string;
    meta_ops_semanales?: number;
    activo: boolean;

    // Read-only / Expanded fields from backend
    usuario_username?: string;
    casa_nombre?: string;
    distribuidora_nombre?: string;
    agencia_nombre?: string;
    deporte_nombre?: string;
    stake_promedio?: number;
    ops_semanales?: number;
    ops_mensuales?: number;
    ops_historicas?: number;
    profit_loss_total?: number;
    saldo_actual?: number | string;
}

export interface CreatePerfilData {
    agencia: number;
    persona: number;
    nombre_usuario: string;
    tipo_jugador: string;
    nivel_cuenta: string;
    deporte_dna?: number;
    ip_operativa?: string;
    preferencias?: string;
    activo?: boolean;
    // Password usually handled separately or via initial creation, assuming standard CRUD for now
    password?: string;
}

export interface UpdatePerfilData extends Partial<CreatePerfilData> { }

export const perfilesService = {
    getAll: async () => {
        return await apiClient.get<PaginatedResponse<PerfilOperativo>>(API_ENDPOINTS.PERFILES_OPERATIVOS);
    },

    create: async (data: CreatePerfilData) => {
        return await apiClient.post<PerfilOperativo>(API_ENDPOINTS.PERFILES_OPERATIVOS, data);
    },

    update: async (id: number, data: UpdatePerfilData) => {
        return await apiClient.patch<PerfilOperativo>(`${API_ENDPOINTS.PERFILES_OPERATIVOS}${id}/`, data);
    },

    getById: async (id: number) => {
        return await apiClient.get<PerfilOperativo>(`${API_ENDPOINTS.PERFILES_OPERATIVOS}${id}/`);
    },

    remove: async (id: number) => {
        return await apiClient.delete(`${API_ENDPOINTS.PERFILES_OPERATIVOS}${id}/`);
    }
};
