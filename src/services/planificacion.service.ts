import { apiClient } from './api.client';
import { API_ENDPOINTS } from '../config/api.config';

export interface PlanificacionDia {
    id_planificacion?: number;
    perfil: number; // ID del perfil
    perfil_usuario?: string;
    fecha: string; // YYYY-MM-DD
    estado_dia: 'A' | 'D';
    mes?: number;
    anio?: number;
}

export interface UpdatePlanificacionData {
    perfil: number;
    fecha: string;
    estado_dia: 'A' | 'D';
    mes: number;
    anio: number;
}

export const planificacionService = {
    /**
     * Obtiene la planificación completa
     */
    async getPlanificacion(): Promise<PlanificacionDia[]> {
        return await apiClient.get<PlanificacionDia[]>(API_ENDPOINTS.PLANIFICACION);
    },

    /**
     * Actualiza el estado de un día específico
     * Si no existe, el backend lo crea (upsert logic implícita o manejo en backend)
     */
    async updateEstadoDia(data: UpdatePlanificacionData): Promise<PlanificacionDia> {
        // Asumiendo POST como método seguro para "crear o actualizar" según contrato dado
        return await apiClient.post<PlanificacionDia>(API_ENDPOINTS.PLANIFICACION, data);
    },

    /**
     * Actualizar estado específico via PATCH (alternativa si se tiene ID)
     */
    async patchEstadoDia(idPlanificacion: number, estado: 'A' | 'D'): Promise<PlanificacionDia> {
        return await apiClient.patch<PlanificacionDia>(`${API_ENDPOINTS.PLANIFICACION}${idPlanificacion}/`, {
            estado_dia: estado
        });
    }
};
