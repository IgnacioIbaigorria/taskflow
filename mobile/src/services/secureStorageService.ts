import * as SecureStore from 'expo-secure-store';

const KEYS = {
    CREDENTIALS: 'user_credentials',
};

export const secureStorageService = {
    async saveCredentials(credentials: { email: string; password: string }): Promise<void> {
        try {
            await SecureStore.setItemAsync(KEYS.CREDENTIALS, JSON.stringify(credentials));
        } catch (error) {
            console.error('Error saving credentials:', error);
            throw error;
        }
    },

    async getCredentials(): Promise<{ email: string; password: string } | null> {
        try {
            const result = await SecureStore.getItemAsync(KEYS.CREDENTIALS);
            return result ? JSON.parse(result) : null;
        } catch (error) {
            console.error('Error getting credentials:', error);
            return null;
        }
    },

    async clearCredentials(): Promise<void> {
        try {
            await SecureStore.deleteItemAsync(KEYS.CREDENTIALS);
        } catch (error) {
            console.error('Error clearing credentials:', error);
        }
    }
};
