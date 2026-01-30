import { apiClient } from './api.client';
import {
    Deporte,
    Competicion,
    Distribuidora,
    CreateSenalPayload,
    SenalResponse,
    CreateOperationPayload,
    OperationResponse
} from '../types/operational.types';

const BASE_URL = '/api/gestion-operativa';

export const operationalService = {
    /**
     * Obtiene lista de deportes activos
     */
    async getDeportes(): Promise<Deporte[]> {
        // Use /todos/ to get a flat list, bypassing pagination
        return await apiClient.get<Deporte[]>(`${BASE_URL}/deportes/todos/`);
    },

    /**
     * Obtiene competiciones filtradas por deporte
     */
    async getCompeticiones(deporteId: number): Promise<Competicion[]> {
        return await apiClient.get<Competicion[]>(`${BASE_URL}/competiciones/`, {
            params: { deporte: deporteId }
        });
    },

    /**
     * Obtiene lista de distribuidoras
     */
    async getDistribuidoras(): Promise<Distribuidora[]> {
        const response = await apiClient.get<any>(`${BASE_URL}/distribuidoras/`);
        return response.results || response;
    },

    /**
     * Crea una nueva señal (operación manual)
     */
    async createSenal(data: CreateSenalPayload): Promise<SenalResponse> {
        return await apiClient.post<SenalResponse>(`${BASE_URL}/senales/`, data);
    },

    /**
     * Obtiene la lista de señales (Cola de Ejecución)
     */
    async getSenales(): Promise<SenalResponse[]> {
        return await apiClient.get<SenalResponse[]>(`${BASE_URL}/senales/`);
    },

    /**
     * Registra una nueva operación (ejecución de apuesta)
     */
    async registerOperation(data: CreateOperationPayload): Promise<OperationResponse> {
        return await apiClient.post<OperationResponse>(`${BASE_URL}/operaciones/`, data);
    }
};
