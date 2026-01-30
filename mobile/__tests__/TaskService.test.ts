import { taskService } from '../src/services/taskService';
import { api } from '../src/services/api';

// Mock api
jest.mock('../src/services/api');

describe('TaskService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch tasks', async () => {
        const mockTasks = [{ id: '1', title: 'Task 1' }];
        const mockResponse = { data: { tasks: mockTasks, total: 1 } };
        (api.get as jest.Mock).mockResolvedValue(mockResponse);

        const result = await taskService.getTasks({ page: 1, page_size: 10 });
        expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/tasks?'));
        expect(result).toEqual(mockResponse.data);
    });

    it('should create a task', async () => {
        const newTask = { title: 'New Task' };
        const mockResponse = { data: { id: '1', ...newTask } };
        (api.post as jest.Mock).mockResolvedValue(mockResponse);

        const result = await taskService.createTask(newTask as any);
        expect(api.post).toHaveBeenCalledWith('/tasks', newTask);
        expect(result).toEqual(mockResponse.data);
    });

    it('should update a task', async () => {
        const updateData = { title: 'Updated Task' };
        const mockResponse = { data: { id: '1', ...updateData } };
        (api.put as jest.Mock).mockResolvedValue(mockResponse);

        const result = await taskService.updateTask('1', updateData);
        expect(api.put).toHaveBeenCalledWith('/tasks/1', updateData);
        expect(result).toEqual(mockResponse.data);
    });

    it('should delete a task', async () => {
        (api.delete as jest.Mock).mockResolvedValue({});
        await taskService.deleteTask('1');
        expect(api.delete).toHaveBeenCalledWith('/tasks/1');
    });
});
