export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: Priority;
    due_date?: string;
    created_by: string;
    assigned_to?: string;
    created_at: string;
    updated_at: string;
    creator?: {
        id: string;
        name: string;
        email: string;
    };
    assignee?: {
        id: string;
        name: string;
        email: string;
    };
}

export interface CreateTaskData {
    title: string;
    description: string;
    priority: Priority;
    due_date?: string;
}

export interface UpdateTaskData {
    title?: string;
    description?: string;
    priority?: Priority;
    status?: TaskStatus;
    due_date?: string;
}

export interface TaskFilter {
    status?: TaskStatus;
    priority?: Priority;
    page?: number;
    page_size?: number;
}

export interface TaskListResponse {
    tasks: Task[];
    total: number;
    page: number;
    page_size: number;
}

export interface TaskEvent {
    type: 'created' | 'updated' | 'deleted' | 'assigned';
    task_id: string;
    task?: Task;
    user_id: string;
}
export const PRIORITY_LABELS: Record<Priority, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    urgent: 'Urgente',
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
    pending: 'Pendiente',
    in_progress: 'En Progreso',
    completed: 'Completada',
    cancelled: 'Cancelada',
};
