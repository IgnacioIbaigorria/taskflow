import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { List, Switch, Button, Text, Divider, Avatar } from 'react-native-paper';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTasks } from '../contexts/TaskContext';

export default function ProfileScreen() {
    const { user, logout, biometricUser, toggleBiometric } = useAuth();
    const { theme, isDark, toggleTheme } = useTheme();
    const { tasks } = useTasks();
    const [biometricAvailable, setBiometricAvailable] = useState(false);

    const isBiometricEnabled = !!(user && biometricUser === user.email);

    useEffect(() => {
        checkBiometric();
    }, []);

    const checkBiometric = async () => {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setBiometricAvailable(compatible && enrolled);
    };

    const handleToggleBiometric = async () => {
        if (!biometricAvailable) {
            Alert.alert('Autenticación biométrica no disponible', 'Tu dispositivo no soporta autenticación biométrica');
            return;
        }

        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: isBiometricEnabled ? 'Deshabilitar autenticación biométrica' : 'Habilitar autenticación biométrica',
        });

        if (result.success) {
            const newState = !isBiometricEnabled;
            await toggleBiometric(newState);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Cerrar sesión',
            '¿Estás seguro de que quieres cerrar sesión?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Cerrar sesión',
                    style: 'destructive',
                    onPress: logout,
                },
            ]
        );
    };

    const stats = {
        total: tasks.length,
        created: tasks.filter(t => user && t.created_by === user.id).length,
        assigned: tasks.filter(t => user && t.assigned_to === user.id).length,
        completed: tasks.filter(t => t.status === 'completed').length,
        pending: tasks.filter(t => t.status === 'pending').length,
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.primary }]}>
                <Avatar.Text
                    size={80}
                    label={user?.name.charAt(0) || 'U'}
                    style={styles.avatar}
                />
                <Text style={[styles.name, { color: theme.onPrimary }]}>{user?.name}</Text>
                <Text style={[styles.email, { color: theme.onPrimary }]}>{user?.email}</Text>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Estadísticas</Text>
                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { backgroundColor: theme.card }]}>
                        <Text style={[styles.statNumber, { color: theme.primary }]}>{stats.total}</Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: theme.card }]}>
                        <Text style={[styles.statNumber, { color: theme.text }]}>{stats.created}</Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Creadas</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: theme.card }]}>
                        <Text style={[styles.statNumber, { color: theme.info }]}>{stats.assigned}</Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Asignadas a mí</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: theme.card }]}>
                        <Text style={[styles.statNumber, { color: theme.success }]}>{stats.completed}</Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Completadas</Text>
                    </View>
                </View>
            </View>

            <Divider />

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Configuración</Text>

                <List.Item
                    title="Modo oscuro"
                    left={props => <List.Icon {...props} icon="theme-light-dark" />}
                    right={() => <Switch value={isDark} onValueChange={toggleTheme} />}
                />

                <List.Item
                    title="Autenticación biométrica"
                    description={biometricAvailable ? 'Usar Face ID o huella dactilar' : 'No disponible'}
                    left={props => <List.Icon {...props} icon="fingerprint" />}
                    right={() => (
                        <Switch
                            value={isBiometricEnabled}
                            onValueChange={handleToggleBiometric}
                            disabled={!biometricAvailable}
                        />
                    )}
                />
            </View>

            <Divider />

            <View style={styles.section}>
                <Button
                    mode="contained"
                    onPress={handleLogout}
                    style={styles.logoutButton}
                    buttonColor={theme.error}
                >
                    Cerrar sesión
                </Button>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 32,
        alignItems: 'center',
    },
    avatar: {
        marginBottom: 16,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    email: {
        fontSize: 16,
        opacity: 0.8,
    },
    section: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -6, // Negative margin to offset padding
    },
    statCard: {
        width: '46%', // Approximate half width
        margin: 6,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        textAlign: 'center',
    },
    logoutButton: {
        marginTop: 8,
        borderRadius: 25,
        paddingVertical: 4,
    },
});
