import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { useTheme } from '../contexts/ThemeContext';

export default function SplashScreen() {
    const { theme } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.primary }]}>
            <Text style={[styles.title, { color: theme.onPrimary }]}>TaskFlow</Text>
            <ActivityIndicator size="large" color={theme.onPrimary} style={styles.loader} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 42,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    loader: {
        marginTop: 20,
    },
});
