import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Text, HelperText, IconButton } from 'react-native-paper';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { secureStorageService } from '../services/secureStorageService';
import { storageService } from '../services/storageService';
import { apiService } from '../services/api';

export default function LoginScreen({ navigation }: any) {
    const { login, loginWithBiometric } = useAuth();
    const { theme } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [secureTextEntry, setSecureTextEntry] = useState(true);

    const [showBiometric, setShowBiometric] = useState(false);
    const [isUsingPassword, setIsUsingPassword] = useState(false);

    // Config Modal State
    const [configVisible, setConfigVisible] = useState(false);
    const [serverUrl, setServerUrl] = useState('');

    useEffect(() => {
        checkBiometricPreference();
        loadCurrentUrl();
    }, []);

    const loadCurrentUrl = async () => {
        const url = await apiService.loadBaseUrl();
        setServerUrl(url.replace('/api/v1', ''));
    };

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

    const saveServerUrl = async () => {
        if (!serverUrl) return;
        try {
            await apiService.setBaseUrl(serverUrl);
            setConfigVisible(false);
            Alert.alert('Configuración guardada', 'La URL del servidor se ha actualizado correctamente.');
        } catch (err) {
            Alert.alert('Error', 'No se pudo guardar la configuración');
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.topBar}>
                <IconButton
                    icon={configVisible ? "close" : "cog"}
                    iconColor={theme.textSecondary}
                    size={24}
                    onPress={() => setConfigVisible(!configVisible)}
                />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {configVisible ? (
                    <View style={styles.form}>
                        <View style={styles.header}>
                            <Text style={[styles.title, { color: theme.text }]}>Configuración</Text>
                            <Text style={[styles.subtitle, { color: theme.textSecondary, textAlign: 'center' }]}>
                                URL del Servidor Backend
                            </Text>
                        </View>

                        <Text style={{ color: theme.textSecondary, marginBottom: 10 }}>
                            Ingresa la dirección IP (ej: http://192.168.1.50:8080)
                        </Text>

                        <TextInput
                            label="URL del Servidor"
                            value={serverUrl}
                            onChangeText={setServerUrl}
                            mode="outlined"
                            style={[styles.input, { backgroundColor: theme.surface }]}
                            textColor={theme.text}
                            outlineColor={theme.inputBorder}
                            activeOutlineColor={theme.inputBorderActive}
                        />

                        <Button
                            mode="contained"
                            onPress={saveServerUrl}
                            style={styles.button}
                            icon="content-save"
                        >
                            Guardar Configuración
                        </Button>

                        <Button
                            mode="text"
                            onPress={() => setConfigVisible(false)}
                            style={styles.linkButton}
                        >
                            Cancelar
                        </Button>
                    </View>
                ) : (
                    <>
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
                                        testID="login-email-input"
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
                                        testID="login-password-input"
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
                                        testID="login-submit-button"
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
                    </>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topBar: {
        position: 'absolute',
        top: 40,
        right: 10,
        zIndex: 10,
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
