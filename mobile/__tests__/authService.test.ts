import { authService } from '../src/services/authService';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store');

describe('AuthService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('saveAuthData', () => {
        it('should save authentication data to secure store', async () => {
            const mockResponse = {
                user: { id: '1', email: 'test@example.com', name: 'Test', created_at: '2024-01-01' },
                token: 'access_token',
                refresh_token: 'refresh_token',
            };

            (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

            await authService['saveAuthData'](mockResponse);

            expect(SecureStore.setItemAsync).toHaveBeenCalledWith('access_token', 'access_token');
            expect(SecureStore.setItemAsync).toHaveBeenCalledWith('refresh_token', 'refresh_token');
            expect(SecureStore.setItemAsync).toHaveBeenCalledWith('user', JSON.stringify(mockResponse.user));
        });
    });

    describe('isAuthenticated', () => {
        it('should return true when token exists', async () => {
            (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('some_token');

            const result = await authService.isAuthenticated();

            expect(result).toBe(true);
        });

        it('should return false when token does not exist', async () => {
            (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

            const result = await authService.isAuthenticated();

            expect(result).toBe(false);
        });
    });

    describe('logout', () => {
        it('should clear all authentication data', async () => {
            (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);

            await authService.logout();

            expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('access_token');
            expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('refresh_token');
            expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('user');
        });
    });
});
