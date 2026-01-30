import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from '../models/Task';

const STORAGE_KEYS = {
    TASKS: '@taskflow_tasks',
    OFFLINE_QUEUE: '@taskflow_offline_queue',
    LAST_SYNC: '@taskflow_last_sync',
    BIOMETRIC_USER: '@taskflow_biometric_user',
    USERS: '@taskflow_users',
};



export interface OfflineAction {
    id: string;
    type: 'create' | 'update' | 'delete' | 'updateStatus';
    taskId?: string;
    data: any;
    timestamp: number;
}

class StorageService {
    // User caching
    async saveUsers(users: any[]): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        } catch (error) {
            throw error;
        }
    }

    async getUsers(): Promise<any[]> {
        try {
            const usersJson = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
            return usersJson ? JSON.parse(usersJson) : [];
        } catch (error) {
            throw error;
        }
    }

    // Task caching
    async saveTasks(tasks: Task[]): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
            await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
        } catch (error) {
            throw error;
        }
    }

    async mergeTasks(newTasks: Task[]): Promise<void> {
        try {
            const currentTasks = await this.getTasks();
            const taskMap = new Map(currentTasks.map(t => [t.id, t]));

            newTasks.forEach(t => {
                taskMap.set(t.id, t);
            });

            const merged = Array.from(taskMap.values());
            await this.saveTasks(merged); // Reuse saveTasks to write the full list
        } catch (error) {
            throw error;
        }
    }

    async getTasks(): Promise<Task[]> {
        try {
            const tasksJson = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
            return tasksJson ? JSON.parse(tasksJson) : [];
        } catch (error) {
            throw error;
        }
    }

    async saveTask(task: Task): Promise<void> {
        try {
            const tasks = await this.getTasks();
            const index = tasks.findIndex(t => t.id === task.id);

            if (index >= 0) {
                tasks[index] = task;
            } else {
                tasks.push(task);
            }

            await this.saveTasks(tasks);
        } catch (error) {
            throw error;
        }
    }

    async deleteTask(taskId: string): Promise<void> {
        try {
            const tasks = await this.getTasks();
            const filtered = tasks.filter(t => t.id !== taskId);
            await this.saveTasks(filtered);
        } catch (error) {
            throw error;
        }
    }

    // Offline queue management
    async addToOfflineQueue(action: Omit<OfflineAction, 'id' | 'timestamp'>): Promise<void> {
        try {
            const queue = await this.getOfflineQueue();
            const newAction: OfflineAction = {
                ...action,
                id: Date.now().toString(),
                timestamp: Date.now(),
            };
            queue.push(newAction);
            await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
        } catch (error) {
            throw error;
        }
    }

    async getOfflineQueue(): Promise<OfflineAction[]> {
        try {
            const queueJson = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
            return queueJson ? JSON.parse(queueJson) : [];
        } catch (error) {
            throw error;
        }
    }

    async clearOfflineQueue(): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify([]));
        } catch (error) {
            throw error;
        }
    }

    async getLastSyncTime(): Promise<number | null> {
        try {
            const timestamp = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
            return timestamp ? parseInt(timestamp) : null;
        } catch (error) {
            throw error;
        }
    }

    // Clear all data
    async clearAll(): Promise<void> {
        try {
            await AsyncStorage.multiRemove([
                STORAGE_KEYS.TASKS,
                STORAGE_KEYS.OFFLINE_QUEUE,
                STORAGE_KEYS.LAST_SYNC,
            ]);
        } catch (error) {
            throw error;
        }
    }

    async setBiometricUser(userId: string | null): Promise<void> {
        try {
            if (userId) {
                await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_USER, userId);
            } else {
                await AsyncStorage.removeItem(STORAGE_KEYS.BIOMETRIC_USER);
            }
        } catch (error) {
            throw error;
        }
    }

    async getBiometricUser(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_USER);
        } catch (error) {
            throw error;
        }
    }
}

export const storageService = new StorageService();
