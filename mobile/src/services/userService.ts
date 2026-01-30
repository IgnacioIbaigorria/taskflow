import { api } from './api';

import { storageService } from './storageService';

export interface User {
    id: string;
    name: string;
    email: string;
}

export const userService = {
    getUsers: async (): Promise<User[]> => {
        try {
            const response = await api.get('/users');
            await storageService.saveUsers(response.data);
            return response.data;
        } catch (error) {
            const cachedUsers = await storageService.getUsers();
            if (cachedUsers && cachedUsers.length > 0) {
                return cachedUsers;
            }
            throw error;
        }
    },
};
