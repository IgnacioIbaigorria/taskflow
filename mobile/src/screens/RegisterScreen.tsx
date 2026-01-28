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
            setError('Please fill all fields');
            return;
        }

        if (name.length < 2) {
            setError('Name must be at least 2 characters');
            return;
        }

        if (!validateEmail(email)) {
            setError('Invalid email format');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            setLoading(true);
            await register({ name, email, password });
        } catch (err: any) {
            setError(err.response?.data?.error || 'Registration failed');
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
                    <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        Sign up to get started
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
                        label="Correo Electrónico"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        mode="outlined"
                        style={styles.input}
                        placeholder="your@email.com"
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
                        placeholder="Min 6 characters"
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
                        label="Confirmar Contraseña"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={confirmSecureTextEntry}
                        mode="outlined"
                        style={styles.input}
                        placeholder="Confirm your password"
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
