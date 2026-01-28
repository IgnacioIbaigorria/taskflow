import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { TaskProvider } from './src/contexts/TaskContext';
import AppNavigator from './src/navigation/AppNavigator';

function AppContent() {
    const { theme, isDark } = useTheme();

    const paperTheme = {
        dark: isDark,
        colors: {
            primary: theme.primary,
            accent: theme.secondary,
            background: theme.background,
            surface: theme.surface,
            text: theme.text,
            error: theme.error,
            placeholder: theme.textSecondary,
            backdrop: 'rgba(0, 0, 0, 0.5)',
            onSurfaceVariant: theme.text, // Fix: Use high emphasis text for input labels
            onSurface: theme.onSurface,
            notification: theme.secondary,
        },
    };

    return (
        <PaperProvider theme={paperTheme}>
            <AuthProvider>
                <TaskProvider>
                    <AppNavigator />
                    <StatusBar style={isDark ? 'light' : 'dark'} />
                </TaskProvider>
            </AuthProvider>
        </PaperProvider>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    );
}
