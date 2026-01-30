import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Text, HelperText, IconButton } from 'react-native-paper';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { secureStorageService } from '../services/secureStorageService';
import { storageService } from '../services/storageService';

export default function LoginScreen({ navigation }: any) {
    const { login, loginWithBiometric } = useAuth();
    const { theme } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [secureTextEntry, setSecureTextEntry] = useState(true);

    const [showBiometric, setShowBiometric] = useState(false);
    const [isUsingPassword, setIsUsingPassword] = useState(false); // New state to toggle views

    useEffect(() => {
        checkBiometricPreference();
    }, []);

    const checkBiometricPreference = async () => {
        const bioUser = await storageService.getBiometricUser();
        const enabled = !!bioUser;
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        setShowBiometric(enabled && hasHardware && isEnrolled);

        if (enabled && hasHardware && isEnrolled) {
            handleBiometricLogin();
        } else {
            setIsUsingPassword(true);
        }
    };

    const handleUsePassword = () => {
        setIsUsingPassword(true);
    };

    const handleUseBiometric = () => {
        setIsUsingPassword(false);
        handleBiometricLogin();
    };
    const handleBiometricLogin = async () => {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Iniciar sesión con biometría',
            });

            if (result.success) {
                await loginWithBiometric();
            }
        } catch (error) {
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

            // Save credentials if biometric is enabled (user ID is set)
            const bioUser = await storageService.getBiometricUser();
            if (bioUser) {
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
                    {!isUsingPassword && showBiometric ? (
                        <View style={styles.biometricContainer}>
                            <IconButton
                                icon="fingerprint"
                                size={80}
                                iconColor={theme.primary}
                                style={styles.biometricIcon}
                                onPress={handleBiometricLogin}
                            />
                            <Text style={[styles.biometricText, { color: theme.text }]}>
                                Autenticación biométrica
                            </Text>
                            <Button
                                mode="contained"
                                onPress={handleBiometricLogin}
                                style={styles.button}
                            >
                                Reintentar
                            </Button>
                            <Button
                                mode="text"
                                onPress={handleUsePassword}
                                style={styles.linkButton}
                            >
                                Ingresar con contraseña
                            </Button>
                        </View>
                    ) : (
                        <>
                            <TextInput
                                label="Correo electrónico"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                mode="outlined"
                                style={styles.input}
                                placeholder="Correo electrónico"
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

                            <Button
                                mode="contained"
                                onPress={handleLogin}
                                loading={loading}
                                disabled={loading}
                                style={styles.button}
                            >
                                Iniciar sesión
                            </Button>

                            {showBiometric && (
                                <Button
                                    mode="outlined"
                                    onPress={handleUseBiometric}
                                    style={[styles.button, { borderColor: theme.primary }]}
                                    icon="fingerprint"
                                    textColor={theme.primary}
                                    disabled={loading}
                                >
                                    Usar Biometría
                                </Button>
                            )}

                            <Button
                                mode="text"
                                onPress={() => navigation.navigate('Register')}
                                style={styles.linkButton}
                            >
                                ¿No tienes una cuenta? Registrarse
                            </Button>
                        </>
                    )}
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
    biometricContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    biometricIcon: {
        margin: 0,
    },
    biometricText: {
        fontSize: 18,
        marginTop: 10,
        marginBottom: 20,
    },
});
