/**
 * Example API Service
 * Demonstrates how to use authService for authenticated API calls
 */

import { authService } from './authService';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Example: Get user profile
 */
export async function getUserProfile() {
    try {
        const response = await authService.authenticatedFetch(
            `${BASE_URL}/api/user/profile/`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch user profile');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
    }
}

/**
 * Example: Update user data
 */
export async function updateUserProfile(data: any) {
    try {
        const response = await authService.authenticatedFetch(
            `${BASE_URL}/api/user/profile/`,
            {
                method: 'PUT',
                body: JSON.stringify(data),
            }
        );

        if (!response.ok) {
            throw new Error('Failed to update user profile');
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
}

/**
 * Example: Get data from any protected endpoint
 */
export async function getProtectedData(endpoint: string) {
    try {
        const response = await authService.authenticatedFetch(
            `${BASE_URL}${endpoint}`
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch data from ${endpoint}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error fetching data from ${endpoint}:`, error);
        throw error;
    }
}

/**
 * Example: POST request to protected endpoint
 */
export async function postProtectedData(endpoint: string, data: any) {
    try {
        const response = await authService.authenticatedFetch(
            `${BASE_URL}${endpoint}`,
            {
                method: 'POST',
                body: JSON.stringify(data),
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to post data to ${endpoint}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error posting data to ${endpoint}:`, error);
        throw error;
    }
}
