import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { Switch, Text, IconButton, Divider, Avatar, Surface } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function CustomDrawer(props: any) {
    const { user, logout } = useAuth();
    const { theme, isDark, toggleTheme } = useTheme();

    const handleLogout = async () => {
        await logout();
        props.navigation.closeDrawer();
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <DrawerContentScrollView
                {...props}
                contentContainerStyle={{ flexGrow: 1 }}
                style={{ backgroundColor: theme.background }}
            >
                {/* Header */}
                {/* Header - Professional Design */}
                <Surface style={[styles.header, { backgroundColor: theme.surface }]} elevation={2}>
                    <View style={styles.userInfo}>
                        <Avatar.Text
                            size={56}
                            label={user?.name ? user.name.substring(0, 2).toUpperCase() : 'TF'}
                            style={{ backgroundColor: theme.primary }}
                            color={theme.onPrimary}
                        />
                        <View style={styles.userTextContainer}>
                            <Text style={[styles.welcomeText, { color: theme.textSecondary }]}>Bienvenido,</Text>
                            <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>
                                {user ? user.name : 'Usuario'}
                            </Text>
                        </View>
                    </View>
                </Surface>

                {/* Main Navigation Items */}
                <View style={{ flex: 1 }}>
                    {user && <DrawerItemList {...props} />}
                </View>

                {/* Footer Section */}
                <View style={[styles.footer, { borderTopColor: theme.border }]}>
                    {/* Theme Toggle - Modern Design */}
                    <View style={[styles.themeRow, { backgroundColor: theme.surface }]}>
                        <View style={styles.themeInfo}>
                            <IconButton
                                icon={isDark ? "weather-night" : "weather-sunny"}
                                iconColor={theme.primary}
                                size={24}
                            />
                            <Text style={[styles.themeLabel, { color: theme.text }]}>
                                {isDark ? 'Modo Oscuro' : 'Modo Claro'}
                            </Text>
                        </View>
                        <Switch
                            value={isDark}
                            onValueChange={toggleTheme}
                            color={theme.primary}
                        />
                    </View>

                    {user && (
                        <DrawerItem
                            label="Cerrar sesión"
                            onPress={handleLogout}
                            labelStyle={{ color: theme.error, marginLeft: -16, fontSize: 16 }}
                            icon={({ size }) => (
                                <IconButton icon="logout" iconColor={theme.error} size={size} />
                            )}
                            style={{ marginTop: 8 }}
                        />
                    )}
                </View>
            </DrawerContentScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        padding: 20,
        marginBottom: 16,
        marginHorizontal: 10,
        marginTop: 10,
        borderRadius: 16,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userTextContainer: {
        marginLeft: 16,
        flex: 1,
    },
    welcomeText: {
        fontSize: 14,
        marginBottom: 2,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
    },
    themeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    themeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    themeLabel: {
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 8,
    },
});
