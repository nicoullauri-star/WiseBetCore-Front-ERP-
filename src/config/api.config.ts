/**
 * WiseBet API Configuration
 * Configuración centralizada para la conexión con el backend
 */

// API Base URL - Cambiar en producción
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Endpoints
export const API_ENDPOINTS = {
    // Auth
    LOGIN: '/api/auth/login/',
    LOGOUT: '/api/auth/logout/',
    PROFILE: '/api/auth/profile/',
    TOKEN_REFRESH: '/api/auth/token/refresh/',
    NAVIGATION: '/api/auth/navigation/',

    // Gestión Operativa
    DISTRIBUIDORAS: '/api/gestion-operativa/distribuidoras/',
    CASAS_APUESTAS: '/api/gestion-operativa/casas-apuestas/',
    AGENCIAS: '/api/gestion-operativa/agencias/',
    PERFILES_OPERATIVOS: '/api/gestion-operativa/perfiles-operativos/',
    CONFIGURACION: '/api/gestion-operativa/configuracion-operativa/',
    TRANSACCIONES: '/api/gestion-operativa/transacciones/',
    PLANIFICACION: '/api/gestion-operativa/planificacion-rotacion/',
    ALERTAS: '/api/gestion-operativa/alertas-operativas/',
    BITACORAS: '/api/gestion-operativa/bitacoras-mando/',
    DEPORTES: '/api/gestion-operativa/deportes/',
    PERSONAS: '/api/gestion-operativa/personas/',
    OBJETIVOS_PERFILES: '/api/gestion-operativa/objetivos-perfiles/',
} as const;

// Token keys
export const TOKEN_KEY = 'wisebet_access_token';
export const REFRESH_TOKEN_KEY = 'wisebet_refresh_token';
