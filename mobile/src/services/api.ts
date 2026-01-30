import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8080';

const STORAGE_KEY_API_URL = 'api_url';

class ApiService {
    private api: AxiosInstance;

    constructor() {
        this.api = axios.create({
            baseURL: API_URL + '/api/v1',
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Load saved URL immediately
        this.loadBaseUrl();

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
                            // Use current baseURL for refresh
                            const currentBaseURL = this.api.defaults.baseURL?.replace('/api/v1', '') || API_URL;
                            const response = await axios.post(`${currentBaseURL}/api/v1/auth/refresh`, {
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

    async setBaseUrl(url: string) {
        // Ensure protocol
        if (!url.startsWith('http')) {
            url = `http://${url}`;
        }
        // Remove trailing slash
        url = url.replace(/\/$/, '');

        await SecureStore.setItemAsync(STORAGE_KEY_API_URL, url);
        this.api.defaults.baseURL = `${url}/api/v1`;
        console.log('API URL updated to:', this.api.defaults.baseURL);
    }

    async loadBaseUrl() {
        try {
            const savedUrl = await SecureStore.getItemAsync(STORAGE_KEY_API_URL);
            if (savedUrl) {
                this.api.defaults.baseURL = `${savedUrl}/api/v1`;
                console.log('API URL loaded:', this.api.defaults.baseURL);
                return savedUrl;
            }
        } catch (error) {
            console.error('Error loading API URL:', error);
        }
        return API_URL;
    }

    getInstance(): AxiosInstance {
        return this.api;
    }
}

export const apiService = new ApiService();
export const api = apiService.getInstance();
