import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../src/screens/LoginScreen';
import { useAuth } from '../src/contexts/AuthContext';
import * as LocalAuthentication from 'expo-local-authentication';

// Mocks
jest.mock('../src/contexts/AuthContext', () => ({
    useAuth: jest.fn(),
}));

jest.mock('../src/contexts/ThemeContext', () => ({
    useTheme: () => ({
        theme: {
            background: '#ffffff',
            text: '#000000',
            primary: '#6200ee',
            placeholder: '#888',
        },
    }),
}));

jest.mock('../src/services/storageService', () => ({
    storageService: {
        getBiometricUser: jest.fn().mockResolvedValue(null),
    },
}));

jest.mock('expo-local-authentication', () => ({
    hasHardwareAsync: jest.fn().mockResolvedValue(true),
    isEnrolledAsync: jest.fn().mockResolvedValue(true),
    authenticateAsync: jest.fn(),
}));

jest.mock('../src/services/secureStorageService', () => ({
    secureStorageService: {
        saveCredentials: jest.fn(),
    },
}));

jest.mock('../src/services/api', () => ({
    apiService: {
        loadBaseUrl: jest.fn().mockResolvedValue('http://localhost:8080/api/v1'),
        setBaseUrl: jest.fn(),
    },
}));

describe('LoginScreen', () => {
    const mockLogin = jest.fn();
    const mockNavigation = { navigate: jest.fn() };

    beforeEach(() => {
        jest.clearAllMocks();
        (useAuth as jest.Mock).mockReturnValue({
            login: mockLogin,
            loginWithBiometric: jest.fn(),
        });
    });

    it('renders correctly', () => {
        const { getByText, getByPlaceholderText } = render(<LoginScreen navigation={mockNavigation} />);
        expect(getByText('Bienvenido')).toBeTruthy();
        expect(getByPlaceholderText('Correo electrónico')).toBeTruthy();
    });

    it('shows error on empty fields', async () => {
        const { getByText, getAllByText } = render(<LoginScreen navigation={mockNavigation} />);

        // Find the "Iniciar sesión" button (it might be found twice due to button text and accessibility label)
        // Using getByText with exact: false or testID is better usually.
        // Paper Button renders text inside plain Text.

        const loginButton = getByText('Iniciar sesión');
        fireEvent.press(loginButton);

        await waitFor(() => {
            expect(getByText('Por favor completa todos los campos')).toBeTruthy();
        });
    });

    it('calls login on valid input', async () => {
        const { getByPlaceholderText, getByText } = render(<LoginScreen navigation={mockNavigation} />);

        fireEvent.changeText(getByPlaceholderText('Correo electrónico'), 'test@example.com');
        fireEvent.changeText(getByPlaceholderText('Contraseña'), 'password123');

        fireEvent.press(getByText('Iniciar sesión'));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123',
            });
        });
    });
});
