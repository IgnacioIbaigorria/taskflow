import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import Constants from 'expo-constants';
import { taskService } from '../services/taskService';
import { storageService } from '../services/storageService';
import { websocketService } from '../services/websocketService';
import { syncService } from '../services/syncService';
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
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        checkNetworkStatus();
        const interval = setInterval(checkNetworkStatus, 10000);

        return () => clearInterval(interval);
    }, []);

    // New Effect: Sync when coming online
    useEffect(() => {
        if (!isOffline) {
            const sync = async () => {
                await syncService.sync();
                fetchTasks();
            };
            sync();
        }
    }, [isOffline]);

    const checkNetworkStatus = async () => {
        try {
            const apiUrl = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8080';

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

            const response = await fetch(`${apiUrl}/health`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            setIsOffline(!response.ok && response.status !== 404);
        } catch (error) {
            setIsOffline(true);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            loadTasks();
            const unsubscribe = websocketService.subscribe(handleTaskEvent);

            return () => unsubscribe();
        } else {
            setTasks([]);
        }
    }, [filter, isAuthenticated]);

    const loadTasks = async () => {
        if (isOffline) {
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

            if (filter.page === 1) {
                setTasks(response.tasks);
            } else {
                setTasks(prev => {
                    // Filter out any duplicates just in case
                    const newTasks = response.tasks.filter(nt => !prev.some(pt => pt.id === nt.id));
                    return [...prev, ...newTasks];
                });
            }

            // Always merge fetched tasks into cache to build offline dataset
            await storageService.mergeTasks(response.tasks);
        } catch (error) {
            if (filter.page === 1) {
                const cachedTasks = await storageService.getTasks();
                setTasks(cachedTasks);
            }
        } finally {
            setLoading(false);
        }
    };

    const createTask = async (data: CreateTaskData) => {
        if (isOffline) {
            const tempId = 'offline-' + Date.now();
            // Create an optimistic task. Note: We might miss some fields like created_by, but it allows viewing.
            const optimisticTask: Task = {
                id: tempId,
                title: data.title,
                description: data.description || '',
                priority: data.priority || 'medium',
                status: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                // assigned_to: data.assigned_to // CreateTaskData might not have this, check definition. Assuming basic data.
            } as Task;

            setTasks(prev => [optimisticTask, ...prev]);
            await storageService.saveTask(optimisticTask);
            await storageService.addToOfflineQueue({ type: 'create', data });
            return;
        }

        try {
            const newTask = await taskService.createTask(data);
            setTasks(prev => {
                if (prev.some(t => t.id === newTask.id)) {
                    return prev;
                }
                return [newTask, ...prev];
            });
            await storageService.saveTask(newTask);
        } catch (error) {
            throw error;
        }
    };

    const updateTask = async (id: string, data: UpdateTaskData) => {
        if (isOffline) {
            setTasks(prev => prev.map(t => {
                if (t.id === id) {
                    const updated = { ...t, ...data, updated_at: new Date().toISOString() };
                    storageService.saveTask(updated);
                    return updated;
                }
                return t;
            }));
            await storageService.addToOfflineQueue({ type: 'update', taskId: id, data });
            return;
        }

        try {
            const updatedTask = await taskService.updateTask(id, data);
            setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
            await storageService.saveTask(updatedTask);
        } catch (error) {
            throw error;
        }
    };

    const deleteTask = async (id: string) => {
        if (isOffline) {
            setTasks(prev => prev.filter(t => t.id !== id));
            await storageService.deleteTask(id);
            await storageService.addToOfflineQueue({ type: 'delete', taskId: id, data: null });
            return;
        }

        try {
            await taskService.deleteTask(id);
            setTasks(prev => prev.filter(t => t.id !== id));
            await storageService.deleteTask(id);
        } catch (error) {
            throw error;
        }
    };

    const updateTaskStatus = async (id: string, status: TaskStatus) => {
        if (isOffline) {
            setTasks(prev => prev.map(t => {
                if (t.id === id) {
                    const updated = { ...t, status, updated_at: new Date().toISOString() };
                    storageService.saveTask(updated);
                    return updated;
                }
                return t;
            }));
            await storageService.addToOfflineQueue({ type: 'updateStatus', taskId: id, data: { status } });
            return;
        }

        try {
            const updatedTask = await taskService.updateStatus(id, status);
            setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
            await storageService.saveTask(updatedTask);
        } catch (error) {
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
                    setTasks(prev => {
                        // Check if we already have this task (e.g. from the API call that created it)
                        if (prev.some(t => t.id === event.task!.id)) {
                            return prev;
                        }
                        return [event.task!, ...prev];
                    });
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
