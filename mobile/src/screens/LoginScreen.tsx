import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Text, HelperText, IconButton } from 'react-native-paper';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { secureStorageService } from '../services/secureStorageService';
import { storageService } from '../services/storageService';

export default function LoginScreen({ navigation }: any) {
    const { login } = useAuth();
    const { theme } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [secureTextEntry, setSecureTextEntry] = useState(true);

    const [showBiometric, setShowBiometric] = useState(false);

    useEffect(() => {
        checkBiometricPreference();
    }, []);

    const checkBiometricPreference = async () => {
        const enabled = await storageService.isBiometricEnabled();
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        setShowBiometric(enabled && hasHardware && isEnrolled);

        if (enabled && hasHardware && isEnrolled) {
            // Optional: Auto-prompt could go here, but button is safer UX
        }
    };

    const handleBiometricLogin = async () => {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Iniciar sesión con biometría',
            });

            if (result.success) {
                setLoading(true);
                const credentials = await secureStorageService.getCredentials();
                if (credentials) {
                    await login(credentials);
                } else {
                    Alert.alert(
                        'Credenciales no guardadas',
                        'Por favor inicia sesión manualmente una vez para guardar tus credenciales de forma segura.'
                    );
                }
            }
        } catch (error) {
            console.error(error);
            setError('Error en autenticación biométrica');
        } finally {
            setLoading(false);
        }
    };

    const validateEmail = (email: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const handleLogin = async () => {
        setError('');

        if (!email || !password) {
            setError('Por favor completa todos los campos');
            return;
        }

        if (!validateEmail(email)) {
            setError('Formato de correo electrónico inválido');
            return;
        }

        try {
            setLoading(true);
            await login({ email, password });

            // Save credentials if biometric is enabled
            const biometricEnabled = await storageService.isBiometricEnabled();
            if (biometricEnabled) {
                await secureStorageService.saveCredentials({ email, password });
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Inicio de sesión fallido');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.text }]}>Bienvenido</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        Inicia sesión para continuar
                    </Text>
                </View>

                <View style={styles.form}>
                    <TextInput
                        label="Correo Electrónico"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        mode="outlined"
                        style={styles.input}
                        placeholder="Correo Electrónico"
                        placeholderTextColor={theme.placeholder}
                        outlineColor={theme.inputBorder}
                        activeOutlineColor={theme.inputBorderActive}
                        textColor={theme.text}
                    />

                    <TextInput
                        label="Contraseña"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={secureTextEntry}
                        mode="outlined"
                        style={styles.input}
                        placeholder="Contraseña"
                        placeholderTextColor={theme.placeholder}
                        outlineColor={theme.inputBorder}
                        activeOutlineColor={theme.inputBorderActive}
                        textColor={theme.text}
                        right={
                            <TextInput.Icon
                                icon={secureTextEntry ? "eye" : "eye-off"}
                                onPress={() => setSecureTextEntry(!secureTextEntry)}
                            />
                        }
                    />

                    {error ? <HelperText type="error" visible={!!error}>{error}</HelperText> : null}

                    {showBiometric && (
                        <Button
                            mode="outlined"
                            onPress={handleBiometricLogin}
                            style={[styles.button, { borderColor: theme.primary }]}
                            icon="fingerprint"
                            textColor={theme.primary}
                            disabled={loading}
                        >
                            Ingresar con Biometría
                        </Button>
                    )}

                    <Button
                        mode="contained"
                        onPress={handleLogin}
                        loading={loading}
                        disabled={loading}
                        style={styles.button}
                    >
                        Iniciar Sesión
                    </Button>

                    <Button
                        mode="text"
                        onPress={() => navigation.navigate('Register')}
                        style={styles.linkButton}
                    >
                        ¿No tienes una cuenta? Registrarse
                    </Button>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        marginBottom: 40,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
    },
    form: {
        width: '100%',
    },
    input: {
        marginBottom: 16,
    },
    button: {
        marginTop: 16,
        paddingVertical: 6,
    },
    linkButton: {
        marginTop: 12,
    },
});
