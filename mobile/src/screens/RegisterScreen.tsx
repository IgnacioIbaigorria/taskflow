import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function RegisterScreen({ navigation }: any) {
    const { register } = useAuth();
    const { theme } = useTheme();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [secureTextEntry, setSecureTextEntry] = useState(true);
    const [confirmSecureTextEntry, setConfirmSecureTextEntry] = useState(true);

    const validateEmail = (email: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const handleRegister = async () => {
        setError('');

        if (!name || !email || !password || !confirmPassword) {
            setError('Por favor, completa todos los campos');
            return;
        }

        if (name.length < 2) {
            setError('El nombre debe tener al menos 2 caracteres');
            return;
        }

        if (!validateEmail(email)) {
            setError('El correo electrónico no es válido');
            return;
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        try {
            setLoading(true);
            await register({ name, email, password });
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al registrar');
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
                    <Text style={[styles.title, { color: theme.text }]}>Crear cuenta</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        Registrate para comenzar
                    </Text>
                </View>

                <View style={styles.form}>
                    <TextInput
                        label="Nombre"
                        value={name}
                        onChangeText={setName}
                        mode="outlined"
                        style={styles.input}
                        placeholder="Tu nombre"
                        placeholderTextColor={theme.placeholder}
                        outlineColor={theme.inputBorder}
                        activeOutlineColor={theme.inputBorderActive}
                        textColor={theme.text}
                    />

                    <TextInput
                        label="Correo electrónico"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        mode="outlined"
                        style={styles.input}
                        placeholder="tu@email.com"
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
                        placeholder="Mínimo 6 caracteres"
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

                    <TextInput
                        label="Confirmar contraseña"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={confirmSecureTextEntry}
                        mode="outlined"
                        style={styles.input}
                        placeholder="Confirma tu contraseña"
                        placeholderTextColor={theme.placeholder}
                        outlineColor={theme.inputBorder}
                        activeOutlineColor={theme.inputBorderActive}
                        textColor={theme.text}
                        right={
                            <TextInput.Icon
                                icon={confirmSecureTextEntry ? "eye" : "eye-off"}
                                onPress={() => setConfirmSecureTextEntry(!confirmSecureTextEntry)}
                            />
                        }
                    />

                    {error ? <HelperText type="error" visible={!!error}>{error}</HelperText> : null}

                    <Button
                        mode="contained"
                        onPress={handleRegister}
                        loading={loading}
                        disabled={loading}
                        style={styles.button}
                    >
                        Registrarse
                    </Button>

                    <Button
                        mode="text"
                        onPress={() => navigation.navigate('Login')}
                        style={styles.linkButton}
                    >
                        ¿Ya tienes una cuenta? Iniciar sesión
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
