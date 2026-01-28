import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { TaskEvent } from '../models/Task';

const WS_URL = Constants.expoConfig?.extra?.wsUrl || 'ws://localhost:8080';

type EventCallback = (event: TaskEvent) => void;

class WebSocketService {
    private socket: WebSocket | null = null;
    private listeners: EventCallback[] = [];
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectTimer: NodeJS.Timeout | null = null;

    async connect(): Promise<void> {
        if (this.socket?.readyState === WebSocket.OPEN) {
            return;
        }

        try {
            const token = await SecureStore.getItemAsync('access_token');
            if (!token) {
                console.log('No token available for WebSocket connection');
                return;
            }

            // Close existing connection if any
            if (this.socket) {
                this.socket.close();
            }

            // Convert http:// or https:// to ws:// or wss://
            const wsProtocol = WS_URL.replace('http://', 'ws://').replace('https://', 'wss://');
            const wsUrl = `${wsProtocol}/api/v1/ws?token=${token}`;

            this.socket = new WebSocket(wsUrl);

            this.socket.onopen = () => {
                console.log('WebSocket connected');
                this.reconnectAttempts = 0;
                if (this.reconnectTimer) {
                    clearTimeout(this.reconnectTimer);
                    this.reconnectTimer = null;
                }
            };

            this.socket.onclose = (event) => {
                console.log('WebSocket disconnected:', event.code, event.reason);
                this.attemptReconnect();
            };

            this.socket.onmessage = (event) => {
                try {
                    const taskEvent: TaskEvent = JSON.parse(event.data);
                    this.notifyListeners(taskEvent);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket connection error:', error);
            };
        } catch (error) {
            console.error('Error setting up WebSocket:', error);
            this.attemptReconnect();
        }
    }

    private attemptReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('Max reconnect attempts reached');
            return;
        }

        if (this.reconnectTimer) {
            return; // Already scheduled
        }

        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 5000);

        console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
        }, delay);
    }

    disconnect(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.reconnectAttempts = 0;
    }

    subscribe(callback: EventCallback): () => void {
        this.listeners.push(callback);

        // Return unsubscribe function
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    private notifyListeners(event: TaskEvent): void {
        this.listeners.forEach(callback => {
            try {
                callback(event);
            } catch (error) {
                console.error('Error in WebSocket listener:', error);
            }
        });
    }

    isConnected(): boolean {
        return this.socket?.readyState === WebSocket.OPEN;
    }
}

export const websocketService = new WebSocketService();
