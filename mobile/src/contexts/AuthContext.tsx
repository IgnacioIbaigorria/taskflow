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
    biometricUser: string | null;
    toggleBiometric: (enabled: boolean) => Promise<void>;
    loginWithBiometric: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [biometricUser, setBiometricUser] = useState<string | null>(null);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const bioUser = await storageService.getBiometricUser();
            setBiometricUser(bioUser);

            const isAuth = await authService.isAuthenticated();

            if (isAuth) {
                const currentUser = await authService.getCurrentUser();
                setUser(currentUser);
                await websocketService.connect();
            } else {
                if (bioUser && await authService.hasSavedCredentials()) {
                }
            }
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const toggleBiometric = async (enabled: boolean) => {
        if (!user) return;

        if (enabled) {
            setBiometricUser(user.email);
            await storageService.setBiometricUser(user.email);
        } else {
            setBiometricUser(null);
            await storageService.setBiometricUser(null);
        }
    };

    const loginWithBiometric = async () => {
        try {
            setLoading(true);
            const response = await authService.loginWithSavedCredentials();
            setUser(response.user);
            await websocketService.connect();
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const login = async (credentials: LoginCredentials) => {
        const response = await authService.login(credentials);
        setUser(response.user);

        if (biometricUser && biometricUser !== response.user.email) {
            setBiometricUser(null);
            await storageService.setBiometricUser(null);
        }

        await websocketService.connect();
    };

    const register = async (data: RegisterData) => {
        const response = await authService.register(data);
        setUser(response.user);

        await websocketService.connect();
    };

    const logout = async () => {
        const keepBiometric = !!(user && biometricUser === user.email);

        await authService.logout(keepBiometric);
        setUser(null);

        websocketService.disconnect();
        await storageService.saveTasks([]);

        if (!keepBiometric) {
            setBiometricUser(null);
            await storageService.setBiometricUser(null);
        }
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
                biometricUser,
                toggleBiometric,
                loginWithBiometric,
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
