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
                this.reconnectAttempts = 0;
                if (this.reconnectTimer) {
                    clearTimeout(this.reconnectTimer);
                    this.reconnectTimer = null;
                }
            };

            this.socket.onclose = (event) => {
                this.attemptReconnect();
            };

            this.socket.onmessage = (event) => {
                try {
                    const taskEvent: TaskEvent = JSON.parse(event.data);
                    this.notifyListeners(taskEvent);
                } catch (error) {
                    // Error parsing WebSocket message
                }
            };

            this.socket.onerror = (error) => {
                // WebSocket connection error
            };
        } catch (error) {
            // Error setting up WebSocket
            this.attemptReconnect();
        }
    }

    private attemptReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            return;
        }

        if (this.reconnectTimer) {
            return; // Already scheduled
        }

        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 5000);

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

        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    private notifyListeners(event: TaskEvent): void {
        this.listeners.forEach(callback => {
            try {
                callback(event);
            } catch (error) {
                throw error;
            }
        });
    }

    isConnected(): boolean {
        return this.socket?.readyState === WebSocket.OPEN;
    }
}

export const websocketService = new WebSocketService();
