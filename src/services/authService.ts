// Authentication Service
// Manages JWT tokens (access & refresh) and provides authenticated API calls

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface LoginResponse {
    user: {
        id: number;
        username: string;
        email: string;
        first_name: string;
        last_name: string;
        phone: string | null;
        created_at: string;
    };
    refresh: string;
    access: string;
    message: string;
}

export interface RefreshResponse {
    access: string;
}

export interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    created_at: string;
}

class AuthService {
    private readonly ACCESS_TOKEN_KEY = 'access_token';
    private readonly REFRESH_TOKEN_KEY = 'refresh_token';
    private readonly USER_DATA_KEY = 'user_data';

    /**
     * Save authentication tokens and user data to localStorage
     */
    saveTokens(loginResponse: LoginResponse): void {
        localStorage.setItem(this.ACCESS_TOKEN_KEY, loginResponse.access);
        localStorage.setItem(this.REFRESH_TOKEN_KEY, loginResponse.refresh);
        localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(loginResponse.user));
    }

    /**
     * Get the current access token
     */
    getAccessToken(): string | null {
        return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    }

    /**
     * Get the current refresh token
     */
    getRefreshToken(): string | null {
        return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }

    /**
     * Get the current user data
     */
    getUserData(): User | null {
        const userData = localStorage.getItem(this.USER_DATA_KEY);
        return userData ? JSON.parse(userData) : null;
    }

    /**
     * Update only the access token (used after refresh)
     */
    updateAccessToken(accessToken: string): void {
        localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    }

    /**
     * Clear all authentication data
     */
    clearAuth(): void {
        localStorage.removeItem(this.ACCESS_TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        localStorage.removeItem(this.USER_DATA_KEY);
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return !!this.getAccessToken() && !!this.getRefreshToken();
    }

    /**
     * Refresh the access token using the refresh token
     */
    async refreshAccessToken(): Promise<string> {
        const refreshToken = this.getRefreshToken();

        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        try {
            const response = await fetch(`${BASE_URL}/api/auth/token/refresh/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    refresh: refreshToken,
                }),
            });

            if (!response.ok) {
                // If refresh fails, clear auth data
                this.clearAuth();
                throw new Error('Failed to refresh token');
            }

            const data: RefreshResponse = await response.json();
            this.updateAccessToken(data.access);
            return data.access;
        } catch (error) {
            this.clearAuth();
            throw error;
        }
    }

    /**
     * Make an authenticated API request
     * Automatically handles token refresh if the request fails with 401
     */
    async authenticatedFetch(
        url: string,
        options: RequestInit = {}
    ): Promise<Response> {
        let accessToken = this.getAccessToken();

        if (!accessToken) {
            throw new Error('No access token available');
        }

        // Add authorization header
        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        };

        // First attempt
        let response = await fetch(url, {
            ...options,
            headers,
        });

        // If unauthorized, try to refresh token and retry
        if (response.status === 401) {
            try {
                accessToken = await this.refreshAccessToken();

                // Retry with new token
                response = await fetch(url, {
                    ...options,
                    headers: {
                        ...options.headers,
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                });
            } catch (error) {
                // Refresh failed, redirect to login or throw error
                throw new Error('Authentication failed. Please login again.');
            }
        }

        return response;
    }

    /**
     * Login user
     */
    async login(username: string, password: string): Promise<LoginResponse> {
        const response = await fetch(`${BASE_URL}/api/auth/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                password,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Login failed');
        }

        const data: LoginResponse = await response.json();
        this.saveTokens(data);
        return data;
    }

    /**
     * Logout user
     */
    logout(): void {
        this.clearAuth();
    }
}

// Export a singleton instance
export const authService = new AuthService();
export default authService;
