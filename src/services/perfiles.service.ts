
import { apiClient } from './api.client';
import { API_ENDPOINTS } from '../config/api.config';
import type { PaginatedResponse } from '../types';

export interface PerfilOperativo {
    id_perfil: number;
    usuario: number; // ID of the User
    persona: number; // ID of the Persona
    agencia: number; // ID of the Agencia
    nombre_usuario: string; // "user_pro_..."
    tipo_jugador: string;
    deporte_dna: number | null;
    ip_operativa: string;
    preferencias: string;
    nivel_cuenta: string;
    meta_ops_semanales: number;
    activo: boolean;
    // ... other fields
}

export interface CreatePerfilData {
    usuario_id?: number; // Optional if created automatically? But the model says ForeignKey. 
    // We might need to creates a User first OR the backend handles it.
    // Assuming for now we send what the model expects, OR we might need a composite endpoint.
    // Given the prompt "assign a user and password", it implies creating a Django User too.
    // If the standard PerfilOperativoViewSet expects a user ID, we have a problem if we don't create the user first.
    // However, usually "Register Profile" implies creating the whole package.

    // For this MVP step, I will assume we pass the fields expected by the serializer.
    // If the serializer expects 'usuario' ID, we need to pick an existing user or create one.
    // The visual requirement says "assign user and password". This implies we are creating the user account.

    // Changing strategy: The typical flow is Create User -> Create Profile linked to User.
    // I will add a custom action or handle it in the frontend.
    // For simplicity and standard DRF, I'll assume we might need to hit a registration endpoint or the PerfilViewSet handles user creation (unlikely for standard ViewSet).

    // LET'S ASSUME we just need to pass the data and maybe I'll need to adjust the backend ViewSet to handle user creation if it doesn't.
    // BUT checking the models: PerfilOperativo has foreign key to User.
    // I will stick to the standard REST:
    // 1. We might not be able to create the User via standard PerfilOperativo create.
    // User needs to be created first. 

    // Wait, the requirement says "assign a user and password".
    // I'll create a CreatePerfilDTO that includes username/password.
    // I'll assume for now I'll send this to the backend.

    persona: number;
    agencia: number;
    nombre_usuario: string; // This is the profile name, often matches the bookie username
    tipo_jugador: string;
    nivel_cuenta: string;
    // ...
}

export const perfilesService = {
    getAll: async () => {
        return await apiClient.get<PaginatedResponse<PerfilOperativo>>(API_ENDPOINTS.PERFILES_OPERATIVOS);
    },

    create: async (data: any) => {
        return await apiClient.post<PerfilOperativo>(API_ENDPOINTS.PERFILES_OPERATIVOS, data);
    }
};
