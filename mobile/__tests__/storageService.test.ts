import { storageService } from '../src/services/storageService';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage');

describe('StorageService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('saveTasks', () => {
        it('should save tasks to storage', async () => {
            const mockTasks = [
                {
                    id: '1',
                    title: 'Test Task',
                    description: 'Test Description',
                    status: 'pending' as const,
                    priority: 'medium' as const,
                    created_by: 'user1',
                    created_at: '2024-01-01',
                    updated_at: '2024-01-01',
                },
            ];

            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

            await storageService.saveTasks(mockTasks);

            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                '@taskflow_tasks',
                JSON.stringify(mockTasks)
            );
        });
    });

    describe('getTasks', () => {
        it('should retrieve tasks from storage', async () => {
            const mockTasks = [{ id: '1', title: 'Test' }];
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockTasks));

            const tasks = await storageService.getTasks();

            expect(tasks).toEqual(mockTasks);
        });

        it('should return empty array when no tasks exist', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

            const tasks = await storageService.getTasks();

            expect(tasks).toEqual([]);
        });
    });

    describe('addToOfflineQueue', () => {
        it('should add action to offline queue', async () => {
            (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]));
            (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

            await storageService.addToOfflineQueue({
                type: 'create',
                data: { title: 'New Task' },
            });

            expect(AsyncStorage.setItem).toHaveBeenCalled();
        });
    });
});
