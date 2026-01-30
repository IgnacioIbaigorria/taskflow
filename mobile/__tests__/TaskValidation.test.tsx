import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { TaskProvider, useTasks } from '../src/contexts/TaskContext';
import { taskService } from '../src/services/taskService';
import { storageService } from '../src/services/storageService';
import { websocketService } from '../src/services/websocketService';
import { syncService } from '../src/services/syncService';
import { AuthProvider } from '../src/contexts/AuthContext';

// Mock dependencies
jest.mock('../src/services/taskService');
jest.mock('../src/services/storageService');
jest.mock('../src/services/websocketService');
jest.mock('../src/services/syncService');

// Mock Expo Constants
jest.mock('expo-constants', () => ({
    expoConfig: {
        extra: {
            apiUrl: 'http://localhost:8080',
        },
    },
}));

// Mock AsyncStorage - THIS WAS THE FIX
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../src/contexts/AuthContext', () => ({
    useAuth: () => ({ isAuthenticated: true }),
    AuthProvider: ({ children }: any) => children,
}));

describe('TaskContext Validation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (taskService.getTasks as jest.Mock).mockResolvedValue({ tasks: [], total: 0 });
        (storageService.getTasks as jest.Mock).mockResolvedValue([]);
        (storageService.saveTask as jest.Mock).mockResolvedValue(true);
        (websocketService.subscribe as jest.Mock).mockReturnValue(() => { }); // Return unsubscribe function
        (syncService.sync as jest.Mock).mockResolvedValue(undefined);
        // Mock global fetch for checkNetworkStatus
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({}),
            })
        ) as any;
    });

    it('createTask should propagate error when backend rejects past due date', async () => {
        const errorMsg = 'due date cannot be in the past';
        (taskService.createTask as jest.Mock).mockRejectedValue(new Error(errorMsg));

        const wrapper = ({ children }: any) => (
            <AuthProvider>
                <TaskProvider>{children}</TaskProvider>
            </AuthProvider>
        );

        const { result } = renderHook(() => useTasks(), { wrapper });

        const taskData = {
            title: 'Past Task',
            description: 'Description',
            priority: 'medium' as const,
            due_date: '2020-01-01T00:00:00Z',
        };

        await expect(result.current.createTask(taskData)).rejects.toThrow(errorMsg);
    });

    it('updateTask should propagate error when backend rejects invalid data', async () => {
        const errorMsg = 'invalid priority';
        (taskService.updateTask as jest.Mock).mockRejectedValue(new Error(errorMsg));

        const wrapper = ({ children }: any) => (
            <AuthProvider>
                <TaskProvider>{children}</TaskProvider>
            </AuthProvider>
        );

        const { result } = renderHook(() => useTasks(), { wrapper });

        await expect(result.current.updateTask('task-id', { priority: 'invalid' as any })).rejects.toThrow(errorMsg);
    });
});
