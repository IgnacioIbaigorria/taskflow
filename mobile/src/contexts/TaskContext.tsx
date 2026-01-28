import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import Constants from 'expo-constants';
import { taskService } from '../services/taskService';
import { storageService } from '../services/storageService';
import { websocketService } from '../services/websocketService';
import { Task, TaskFilter, CreateTaskData, UpdateTaskData, TaskStatus, TaskEvent } from '../models/Task';

interface TaskContextType {
    tasks: Task[];
    loading: boolean;
    isOffline: boolean;
    filter: TaskFilter;
    setFilter: (filter: TaskFilter) => void;
    fetchTasks: () => Promise<void>;
    createTask: (data: CreateTaskData) => Promise<void>;
    updateTask: (id: string, data: UpdateTaskData) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    updateTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
    refreshTasks: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const [filter, setFilter] = useState<TaskFilter>({ page: 1, page_size: 20 });

    useEffect(() => {
        // Simple network check - will be true by default
        // In a production app, you'd want to implement a more robust check
        checkNetworkStatus();
        const interval = setInterval(checkNetworkStatus, 10000); // Check every 10 seconds

        return () => clearInterval(interval);
    }, []);

    const checkNetworkStatus = async () => {
        try {
            // Use the configured API URL from app.json via Constants
            const apiUrl = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8080';

            // Make a simple GET request to the health endpoint
            const response = await fetch(`${apiUrl}/health`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });

            // If we get any response (even 404), we're online
            setIsOffline(!response.ok && response.status !== 404);
        } catch (error) {
            // Only set offline if there's a network error
            console.log('Network check failed, setting offline:', error);
            setIsOffline(true);
        }
    };

    useEffect(() => {
        // Load tasks on mount
        loadTasks();

        // Subscribe to WebSocket events
        const unsubscribe = websocketService.subscribe(handleTaskEvent);

        return () => unsubscribe();
    }, [filter]);

    const loadTasks = async () => {
        if (isOffline) {
            // Load from cache when offline
            const cachedTasks = await storageService.getTasks();
            setTasks(cachedTasks);
        } else {
            await fetchTasks();
        }
    };

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const response = await taskService.getTasks(filter);
            setTasks(response.tasks);

            // Cache tasks for offline use
            await storageService.saveTasks(response.tasks);
        } catch (error) {
            console.error('Error fetching tasks:', error);

            // Fallback to cached tasks if network request fails
            const cachedTasks = await storageService.getTasks();
            setTasks(cachedTasks);
        } finally {
            setLoading(false);
        }
    };

    const createTask = async (data: CreateTaskData) => {
        if (isOffline) {
            // Queue for later when online
            await storageService.addToOfflineQueue({ type: 'create', data });
            return;
        }

        try {
            const newTask = await taskService.createTask(data);
            setTasks(prev => [newTask, ...prev]);
            await storageService.saveTask(newTask);
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    };

    const updateTask = async (id: string, data: UpdateTaskData) => {
        if (isOffline) {
            await storageService.addToOfflineQueue({ type: 'update', taskId: id, data });
            return;
        }

        try {
            const updatedTask = await taskService.updateTask(id, data);
            setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
            await storageService.saveTask(updatedTask);
        } catch (error) {
            console.error('Error updating task:', error);
            throw error;
        }
    };

    const deleteTask = async (id: string) => {
        if (isOffline) {
            await storageService.addToOfflineQueue({ type: 'delete', taskId: id, data: null });
            return;
        }

        try {
            await taskService.deleteTask(id);
            setTasks(prev => prev.filter(t => t.id !== id));
            await storageService.deleteTask(id);
        } catch (error) {
            console.error('Error deleting task:', error);
            throw error;
        }
    };

    const updateTaskStatus = async (id: string, status: TaskStatus) => {
        if (isOffline) {
            await storageService.addToOfflineQueue({ type: 'updateStatus', taskId: id, data: { status } });
            return;
        }

        try {
            const updatedTask = await taskService.updateStatus(id, status);
            setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
            await storageService.saveTask(updatedTask);
        } catch (error) {
            console.error('Error updating task status:', error);
            throw error;
        }
    };

    const refreshTasks = async () => {
        await fetchTasks();
    };

    const handleTaskEvent = useCallback((event: TaskEvent) => {
        switch (event.type) {
            case 'created':
                if (event.task) {
                    setTasks(prev => [event.task!, ...prev]);
                }
                break;
            case 'updated':
                if (event.task) {
                    setTasks(prev => prev.map(t => t.id === event.task_id ? event.task! : t));
                }
                break;
            case 'deleted':
                setTasks(prev => prev.filter(t => t.id !== event.task_id));
                break;
        }
    }, []);

    return (
        <TaskContext.Provider
            value={{
                tasks,
                loading,
                isOffline,
                filter,
                setFilter,
                fetchTasks,
                createTask,
                updateTask,
                deleteTask,
                updateTaskStatus,
                refreshTasks,
            }}
        >
            {children}
        </TaskContext.Provider>
    );
}

export function useTasks() {
    const context = useContext(TaskContext);
    if (!context) {
        throw new Error('useTasks must be used within TaskProvider');
    }
    return context;
}
