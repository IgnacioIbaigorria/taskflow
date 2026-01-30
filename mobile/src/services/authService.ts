import { api } from './api';
import * as SecureStore from 'expo-secure-store';
import { AuthResponse, LoginCredentials, RegisterData, User } from '../models/User';

class AuthService {
    async register(data: RegisterData): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/auth/register', data);
        await this.saveAuthData(response.data);
        return response.data;
    }

    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/auth/login', credentials);
        await this.saveAuthData(response.data);
        return response.data;
    }

    async logout(keepBiometric: boolean = false): Promise<void> {
        await SecureStore.deleteItemAsync('access_token');

        if (!keepBiometric) {
            await SecureStore.deleteItemAsync('refresh_token');
            await SecureStore.deleteItemAsync('user');
        }
    }

    async getCurrentUser(): Promise<User | null> {
        const userJson = await SecureStore.getItemAsync('user');
        return userJson ? JSON.parse(userJson) : null;
    }

    async isAuthenticated(): Promise<boolean> {
        const token = await SecureStore.getItemAsync('access_token');
        return !!token;
    }

    async saveAuthData(authResponse: AuthResponse): Promise<void> {
        await SecureStore.setItemAsync('access_token', authResponse.token);
        await SecureStore.setItemAsync('refresh_token', authResponse.refresh_token);
        await SecureStore.setItemAsync('user', JSON.stringify(authResponse.user));
    }

    async hasSavedCredentials(): Promise<boolean> {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        return !!refreshToken;
    }

    async loginWithSavedCredentials(): Promise<AuthResponse> {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        const userJson = await SecureStore.getItemAsync('user');

        if (!refreshToken) throw new Error('No saved credentials');

        // The backend might return only { token: string }
        const response = await api.post<Partial<AuthResponse>>('/auth/refresh', {
            refresh_token: refreshToken
        });

        // Construct full response by merging with existing data if needed
        const fullResponse: AuthResponse = {
            token: response.data.token!, // Token must exist
            refresh_token: response.data.refresh_token || refreshToken,
            user: response.data.user || (userJson ? JSON.parse(userJson) : null)
        };

        if (!fullResponse.user) {
            throw new Error('Could not recover user session');
        }

        await this.saveAuthData(fullResponse);
        return fullResponse;
    }
}

export const authService = new AuthService();
