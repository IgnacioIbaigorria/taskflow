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

    async logout(): Promise<void> {
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        await SecureStore.deleteItemAsync('user');
    }

    async getCurrentUser(): Promise<User | null> {
        const userJson = await SecureStore.getItemAsync('user');
        return userJson ? JSON.parse(userJson) : null;
    }

    async isAuthenticated(): Promise<boolean> {
        const token = await SecureStore.getItemAsync('access_token');
        return !!token;
    }

    private async saveAuthData(authResponse: AuthResponse): Promise<void> {
        await SecureStore.setItemAsync('access_token', authResponse.token);
        await SecureStore.setItemAsync('refresh_token', authResponse.refresh_token);
        await SecureStore.setItemAsync('user', JSON.stringify(authResponse.user));
    }
}

export const authService = new AuthService();
