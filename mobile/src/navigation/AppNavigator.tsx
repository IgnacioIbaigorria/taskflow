import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import TaskListScreen from '../screens/TaskListScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';
import CreateTaskScreen from '../screens/CreateTaskScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { IconButton } from 'react-native-paper';
import { DrawerActions } from '@react-navigation/native';

import CustomDrawer from '../components/CustomDrawer';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

const getHeaderOptions = (theme: any, navigation: any, title: string) => ({
    title,
    headerStyle: {
        backgroundColor: theme.dark ? theme.surface : theme.primary,
    },
    headerTintColor: theme.dark ? theme.text : theme.onPrimary,
    headerTitleStyle: {
        fontWeight: 'bold' as const,
    },
    headerRight: () => (
        <IconButton
            icon="menu"
            iconColor={theme.onPrimary}
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        />
    ),
});

function TasksStack() {
    const { theme } = useTheme();

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: true,
                gestureEnabled: true,
                ...TransitionPresets.SlideFromRightIOS,
            }}
        >
            <Stack.Screen
                name="TaskList"
                component={TaskListScreen}
                options={({ navigation }: { navigation: any }) => getHeaderOptions(theme, navigation, 'Lista de tareas')}
            />
            <Stack.Screen
                name="TaskDetail"
                component={TaskDetailScreen}
                options={({ navigation }: { navigation: any }) => getHeaderOptions(theme, navigation, 'Detalles')}
            />
            <Stack.Screen
                name="CreateTask"
                component={CreateTaskScreen}
                options={({ navigation }: { navigation: any }) => ({
                    ...getHeaderOptions(theme, navigation, 'Nueva tarea'),
                    ...TransitionPresets.ModalSlideFromBottomIOS,
                })}
            />
        </Stack.Navigator>
    );
}

function AuthenticatedDrawer() {
    const { theme } = useTheme();

    return (
        <Drawer.Navigator
            drawerContent={(props: any) => <CustomDrawer {...props} />}
            screenOptions={{
                headerShown: false,
                drawerStyle: {
                    backgroundColor: theme.background,
                },
                drawerActiveTintColor: theme.primary,
                drawerInactiveTintColor: theme.textSecondary,
                drawerPosition: 'right',
            }}
        >
            <Drawer.Screen
                name="HomeStack"
                component={TasksStack}
                options={{
                    drawerLabel: 'Inicio',
                }}
            />
            <Drawer.Screen
                name="Profile"
                component={ProfileScreen}
                options={({ navigation }: { navigation: any }) => ({
                    headerShown: true,
                    ...getHeaderOptions(theme, navigation, 'Perfil'),
                })}
            />
        </Drawer.Navigator>
    );
}

function UnauthenticatedDrawer() {
    const { theme } = useTheme();

    return (
        <Drawer.Navigator
            drawerContent={(props: any) => <CustomDrawer {...props} />}
            screenOptions={{
                headerStyle: {
                    backgroundColor: theme.primary,
                },
                headerTintColor: theme.onPrimary,
                drawerStyle: {
                    backgroundColor: theme.background,
                },
                drawerPosition: 'right',
                headerTitleStyle: {
                    fontWeight: 'bold' as const,
                },
            }}
        >
            <Drawer.Screen
                name="Login"
                component={LoginScreen}
                options={{
                    title: 'TaskFlow',
                }}
            />
            <Drawer.Screen
                name="Register"
                component={RegisterScreen}
                options={{
                    title: 'TaskFlow',
                }}
            />
        </Drawer.Navigator>
    );
}

export default function AppNavigator() {
    const { isAuthenticated, loading } = useAuth();
    const { theme } = useTheme();

    return (
        <NavigationContainer
            theme={{
                dark: theme === require('../theme/colors').darkColors,
                colors: {
                    primary: theme.primary,
                    background: theme.background,
                    card: theme.surface,
                    text: theme.text,
                    border: theme.border,
                    notification: theme.error,
                },
                fonts: {
                    regular: {
                        fontFamily: 'System',
                        fontWeight: '400',
                    },
                    medium: {
                        fontFamily: 'System',
                        fontWeight: '500',
                    },
                    bold: {
                        fontFamily: 'System',
                        fontWeight: '700',
                    },
                    heavy: {
                        fontFamily: 'System',
                        fontWeight: '900',
                    },
                },
            }}
        >
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {loading ? (
                    <Stack.Screen name="Splash" component={SplashScreen} />
                ) : !isAuthenticated ? (
                    <Stack.Screen name="Auth" component={UnauthenticatedDrawer} />
                ) : (
                    <Stack.Screen name="App" component={AuthenticatedDrawer} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
