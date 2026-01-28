import { api } from './api';
import {
    Task,
    CreateTaskData,
    UpdateTaskData,
    TaskFilter,
    TaskListResponse,
    TaskStatus,
} from '../models/Task';

class TaskService {
    async getTasks(filter?: TaskFilter): Promise<TaskListResponse> {
        const params = new URLSearchParams();

        if (filter?.status) params.append('status', filter.status);
        if (filter?.priority) params.append('priority', filter.priority);
        if (filter?.page) params.append('page', filter.page.toString());
        if (filter?.page_size) params.append('page_size', filter.page_size.toString());

        const response = await api.get<TaskListResponse>(`/tasks?${params.toString()}`);
        return response.data;
    }

    async getTaskById(id: string): Promise<Task> {
        const response = await api.get<Task>(`/tasks/${id}`);
        return response.data;
    }

    async createTask(data: CreateTaskData): Promise<Task> {
        const response = await api.post<Task>('/tasks', data);
        return response.data;
    }

    async updateTask(id: string, data: UpdateTaskData): Promise<Task> {
        const response = await api.put<Task>(`/tasks/${id}`, data);
        return response.data;
    }

    async deleteTask(id: string): Promise<void> {
        await api.delete(`/tasks/${id}`);
    }

    async updateStatus(id: string, status: TaskStatus): Promise<Task> {
        const response = await api.patch<Task>(`/tasks/${id}/status`, { status });
        return response.data;
    }

    async assignTask(taskId: string, userId: string): Promise<Task> {
        const response = await api.post<Task>(`/tasks/${taskId}/assign`, {
            assign_to: userId,
        });
        return response.data;
    }
}

export const taskService = new TaskService();
