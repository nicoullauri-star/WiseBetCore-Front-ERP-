/**
 * WiseBet API Client
 * Cliente HTTP base con manejo de autenticación JWT
 */

import { API_BASE_URL, TOKEN_KEY, REFRESH_TOKEN_KEY, API_ENDPOINTS } from '../config/api.config';
import type { NavigationResponse } from '../types/navigation.types';

// ============================================================================
// TYPES
// ============================================================================

interface RequestOptions extends RequestInit {
    params?: Record<string, string | number | boolean>;
}

interface ApiError {
    message: string;
    status: number;
    detail?: string;
}

export interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    numero_contacto: string | null;
    rol: number;
    nombre_completo: string | null;
    created_at: string;
}

export interface LoginRequest {
    identifier: string;
    password: string;
}

export interface LoginResponse {
    user: User;
    refresh: string;
    access: string;
    message: string;
}

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

export const tokenManager = {
    getAccessToken: (): string | null => localStorage.getItem(TOKEN_KEY),
    getRefreshToken: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),

    setTokens: (access: string, refresh: string): void => {
        localStorage.setItem(TOKEN_KEY, access);
        localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    },

    clearTokens: (): void => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
    },

    isAuthenticated: (): boolean => !!localStorage.getItem(TOKEN_KEY),
};

// ============================================================================
// API CLIENT
// ============================================================================

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    /**
     * Construye la URL con query params
     */
    private buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
        const url = new URL(`${this.baseUrl}${endpoint}`);

        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    url.searchParams.append(key, String(value));
                }
            });
        }

        return url.toString();
    }

    /**
     * Headers por defecto con autenticación
     */
    private getHeaders(): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        const token = tokenManager.getAccessToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    /**
     * Maneja la respuesta y errores
     */
    private async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            // Intentar refresh token si es 401
            if (response.status === 401) {
                const refreshed = await this.refreshToken();
                if (!refreshed) {
                    tokenManager.clearTokens();
                    window.location.href = '/login';
                    throw new Error('Session expired');
                }
            }

            const error: ApiError = {
                message: `HTTP Error ${response.status}`,
                status: response.status,
            };

            try {
                const data = await response.json();
                error.detail = data.detail || data.message || JSON.stringify(data);
            } catch {
                // No JSON response
            }

            throw error;
        }

        // Handle 204 No Content
        if (response.status === 204) {
            return {} as T;
        }

        return response.json();
    }

    /**
     * Intenta refrescar el token
     */
    private async refreshToken(): Promise<boolean> {
        const refreshToken = tokenManager.getRefreshToken();
        if (!refreshToken) return false;

        try {
            const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.TOKEN_REFRESH}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh: refreshToken }),
            });

            if (response.ok) {
                const data = await response.json();
                tokenManager.setTokens(data.access, refreshToken);
                return true;
            }
        } catch {
            // Refresh failed
        }

        return false;
    }

    // ============================================================================
    // HTTP METHODS
    // ============================================================================

    async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
        const url = this.buildUrl(endpoint, options?.params);

        const response = await fetch(url, {
            method: 'GET',
            headers: this.getHeaders(),
            ...options,
        });

        return this.handleResponse<T>(response);
    }

    async post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
        const url = this.buildUrl(endpoint, options?.params);

        const response = await fetch(url, {
            method: 'POST',
            headers: this.getHeaders(),
            body: data ? JSON.stringify(data) : undefined,
            ...options,
        });

        return this.handleResponse<T>(response);
    }

    async put<T>(endpoint: string, data: unknown, options?: RequestOptions): Promise<T> {
        const url = this.buildUrl(endpoint, options?.params);

        const response = await fetch(url, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(data),
            ...options,
        });

        return this.handleResponse<T>(response);
    }

    async patch<T>(endpoint: string, data: unknown, options?: RequestOptions): Promise<T> {
        const url = this.buildUrl(endpoint, options?.params);

        const response = await fetch(url, {
            method: 'PATCH',
            headers: this.getHeaders(),
            body: JSON.stringify(data),
            ...options,
        });

        return this.handleResponse<T>(response);
    }

    async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
        const url = this.buildUrl(endpoint, options?.params);

        const response = await fetch(url, {
            method: 'DELETE',
            headers: this.getHeaders(),
            ...options,
        });

        return this.handleResponse<T>(response);
    }

    // ============================================================================
    // AUTH METHODS
    // ============================================================================

    /**
     * Login - No requiere token de autenticación
     */
    async login(credentials: LoginRequest): Promise<LoginResponse> {
        const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.LOGIN}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });

        if (!response.ok) {
            const error: ApiError = {
                message: `HTTP Error ${response.status}`,
                status: response.status,
            };

            try {
                const data = await response.json();
                error.detail = data.detail || data.message || JSON.stringify(data);
            } catch {
                // No JSON response
            }

            throw error;
        }

        const data: LoginResponse = await response.json();

        // Guardar tokens automáticamente
        tokenManager.setTokens(data.access, data.refresh);

        return data;
    }

    /**
     * Get Navigation - Obtiene el menú de navegación del usuario autenticado
     */
    async getNavigation(): Promise<NavigationResponse> {
        return this.get<NavigationResponse>(API_ENDPOINTS.NAVIGATION);
    }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);
