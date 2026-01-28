import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from '../models/Task';

const STORAGE_KEYS = {
    TASKS: '@taskflow_tasks',
    OFFLINE_QUEUE: '@taskflow_offline_queue',
    LAST_SYNC: '@taskflow_last_sync',
    BIOMETRIC_ENABLED: '@taskflow_biometric_enabled',
};

export interface OfflineAction {
    id: string;
    type: 'create' | 'update' | 'delete' | 'updateStatus';
    taskId?: string;
    data: any;
    timestamp: number;
}

class StorageService {
    // Task caching
    async saveTasks(tasks: Task[]): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
            await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
        } catch (error) {
            console.error('Error saving tasks to storage:', error);
        }
    }

    async getTasks(): Promise<Task[]> {
        try {
            const tasksJson = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
            return tasksJson ? JSON.parse(tasksJson) : [];
        } catch (error) {
            console.error('Error getting tasks from storage:', error);
            return [];
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
            console.error('Error saving task:', error);
        }
    }

    async deleteTask(taskId: string): Promise<void> {
        try {
            const tasks = await this.getTasks();
            const filtered = tasks.filter(t => t.id !== taskId);
            await this.saveTasks(filtered);
        } catch (error) {
            console.error('Error deleting task from storage:', error);
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
            console.error('Error adding to offline queue:', error);
        }
    }

    async getOfflineQueue(): Promise<OfflineAction[]> {
        try {
            const queueJson = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
            return queueJson ? JSON.parse(queueJson) : [];
        } catch (error) {
            console.error('Error getting offline queue:', error);
            return [];
        }
    }

    async clearOfflineQueue(): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify([]));
        } catch (error) {
            console.error('Error clearing offline queue:', error);
        }
    }

    async getLastSyncTime(): Promise<number | null> {
        try {
            const timestamp = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
            return timestamp ? parseInt(timestamp) : null;
        } catch (error) {
            console.error('Error getting last sync time:', error);
            return null;
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
            console.error('Error clearing storage:', error);
        }
    }

    async setBiometricEnabled(enabled: boolean): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, JSON.stringify(enabled));
        } catch (error) {
            console.error('Error saving biometric preference:', error);
        }
    }

    async isBiometricEnabled(): Promise<boolean> {
        try {
            const value = await AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
            return value ? JSON.parse(value) : false;
        } catch (error) {
            console.error('Error reading biometric preference:', error);
            return false;
        }
    }
}

export const storageService = new StorageService();
