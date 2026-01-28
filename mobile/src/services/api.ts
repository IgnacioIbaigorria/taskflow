import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8080';

class ApiService {
    private api: AxiosInstance;

    constructor() {
        this.api = axios.create({
            baseURL: `${API_URL}/api/v1`,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Request interceptor to add auth token
        this.api.interceptors.request.use(
            async (config) => {
                const token = await SecureStore.getItemAsync('access_token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor for token refresh
        this.api.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                const originalRequest: any = error.config;

                // If 401 and not already retried
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    try {
                        const refreshToken = await SecureStore.getItemAsync('refresh_token');
                        if (refreshToken) {
                            const response = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
                                refresh_token: refreshToken,
                            });

                            const { token } = response.data;
                            await SecureStore.setItemAsync('access_token', token);

                            originalRequest.headers.Authorization = `Bearer ${token}`;
                            return this.api(originalRequest);
                        }
                    } catch (refreshError) {
                        // Refresh failed, logout user
                        await SecureStore.deleteItemAsync('access_token');
                        await SecureStore.deleteItemAsync('refresh_token');
                        await SecureStore.deleteItemAsync('user');
                        return Promise.reject(refreshError);
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    getInstance(): AxiosInstance {
        return this.api;
    }
}

export const apiService = new ApiService();
export const api = apiService.getInstance();
