import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';
import { websocketService } from '../services/websocketService';
import { storageService } from '../services/storageService';
import { User, LoginCredentials, RegisterData } from '../models/User';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
    biometricEnabled: boolean;
    toggleBiometric: (enabled: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [biometricEnabled, setBiometricEnabled] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            // Check biometric preference
            const isBiometric = await storageService.isBiometricEnabled();
            setBiometricEnabled(isBiometric);

            const isAuth = await authService.isAuthenticated();
            if (isAuth) {
                const currentUser = await authService.getCurrentUser();
                setUser(currentUser);

                // Connect WebSocket
                await websocketService.connect();
            }
        } catch (error) {
            console.error('Error checking auth:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleBiometric = async (enabled: boolean) => {
        setBiometricEnabled(enabled);
        await storageService.setBiometricEnabled(enabled);
    };

    const login = async (credentials: LoginCredentials) => {
        const response = await authService.login(credentials);
        setUser(response.user);

        // Connect WebSocket
        await websocketService.connect();
    };

    const register = async (data: RegisterData) => {
        const response = await authService.register(data);
        setUser(response.user);

        // Connect WebSocket
        await websocketService.connect();
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);

        // Disconnect WebSocket and clear storage
        websocketService.disconnect();
        await storageService.clearAll();

        // Disable biometric to prevent next user inheriting it
        // User must re-enable it if they want it
        await toggleBiometric(false);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isAuthenticated: !!user,
                login,
                register,
                logout,
                biometricEnabled,
                toggleBiometric,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
