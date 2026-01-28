import { api } from './api';

export interface User {
    id: string;
    name: string;
    email: string;
}

export const userService = {
    getUsers: async (): Promise<User[]> => {
        const response = await api.get('/users');
        return response.data;
    },
};
