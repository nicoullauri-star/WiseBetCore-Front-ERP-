/**
 * useAuth Hook
 * Custom React hook for authentication functionality
 */

import { useState, useEffect } from 'react';
import { authService, User } from '../services/authService';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check authentication status on mount
        const checkAuth = () => {
            const authenticated = authService.isAuthenticated();
            const userData = authService.getUserData();

            setIsAuthenticated(authenticated);
            setUser(userData);
            setIsLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (username: string, password: string) => {
        const response = await authService.login(username, password);
        setUser(response.user);
        setIsAuthenticated(true);
        return response;
    };

    const logout = () => {
        authService.logout();
        setUser(null);
        setIsAuthenticated(false);
    };

    const refreshUser = () => {
        const userData = authService.getUserData();
        setUser(userData);
    };

    return {
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshUser,
        getAccessToken: () => authService.getAccessToken(),
        getRefreshToken: () => authService.getRefreshToken(),
    };
}
