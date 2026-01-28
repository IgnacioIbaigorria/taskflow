import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ScrollView } from 'react-native';
import { FAB, Chip, Text, Searchbar, Banner } from 'react-native-paper';
import { useTasks } from '../contexts/TaskContext';
import { useTheme } from '../contexts/ThemeContext';
import { Task, TaskStatus, STATUS_LABELS, PRIORITY_LABELS } from '../models/Task';
import { priorityColors, statusColors } from '../theme/colors';

export default function TaskListScreen({ navigation }: any) {
    const { tasks, loading, isOffline, filter, setFilter, refreshTasks } = useTasks();
    const { theme } = useTheme();
    const [selectedStatus, setSelectedStatus] = useState<TaskStatus | undefined>();

    const filteredTasks = selectedStatus
        ? tasks.filter(t => t.status === selectedStatus)
        : tasks;

    const handleTaskPress = (task: Task) => {
        navigation.navigate('TaskDetail', { taskId: task.id });
    };

    const handleFilterChange = (status?: TaskStatus) => {
        setSelectedStatus(status);
        setFilter({ ...filter, status });
    };

    const renderTask = ({ item }: { item: Task }) => (
        <TouchableOpacity
            style={[styles.taskCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => handleTaskPress(item)}
        >
            <View style={styles.taskHeader}>
                <Text style={[styles.taskTitle, { color: theme.text }]}>{item.title}</Text>
                <View style={[styles.priorityBadge, { backgroundColor: priorityColors[item.priority] }]}>
                    <Text style={styles.priorityText}>{PRIORITY_LABELS[item.priority]}</Text>
                </View>
            </View>

            {item.description ? (
                <Text
                    style={[styles.taskDescription, { color: theme.textSecondary }]}
                    numberOfLines={2}
                >
                    {item.description}
                </Text>
            ) : null}

            <View style={styles.taskFooter}>
                <Chip
                    mode="outlined"
                    style={[styles.statusChip, { borderColor: statusColors[item.status] }]}
                    textStyle={{ color: statusColors[item.status], fontSize: 13 }}
                >
                    {STATUS_LABELS[item.status]}
                </Chip>

                {item.due_date && (
                    <Text style={[styles.dueDate, { color: theme.textSecondary }]}>
                        Due: {new Date(item.due_date).toLocaleDateString()}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {isOffline && (
                <Banner visible={true} icon="wifi-off">
                    No tienes conexión a internet. Los cambios se sincronizarán cuando vuelvas a conectarte.
                </Banner>
            )}

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterContainer}
                contentContainerStyle={styles.filterContent}
            >
                <Chip
                    selected={!selectedStatus}
                    onPress={() => handleFilterChange(undefined)}
                    style={[
                        styles.filterChip,
                        !selectedStatus && { backgroundColor: theme.primary + '20' }
                    ]}
                    textStyle={{ color: theme.text }}
                    showSelectedOverlay={true}
                >
                    Todo
                </Chip>
                <Chip
                    selected={selectedStatus === 'pending'}
                    onPress={() => handleFilterChange('pending')}
                    style={[
                        styles.filterChip,
                        selectedStatus === 'pending' && { backgroundColor: theme.primary + '20' }
                    ]}
                    textStyle={{ color: theme.text }}
                >
                    Pendiente
                </Chip>
                <Chip
                    selected={selectedStatus === 'in_progress'}
                    onPress={() => handleFilterChange('in_progress')}
                    style={[
                        styles.filterChip,
                        selectedStatus === 'in_progress' && { backgroundColor: theme.primary + '20' }
                    ]}
                    textStyle={{ color: theme.text }}
                >
                    En Progreso
                </Chip>
                <Chip
                    selected={selectedStatus === 'completed'}
                    onPress={() => handleFilterChange('completed')}
                    style={[
                        styles.filterChip,
                        selectedStatus === 'completed' && { backgroundColor: theme.primary + '20' }
                    ]}
                    textStyle={{ color: theme.text }}
                >
                    Completado
                </Chip>
            </ScrollView>

            <FlatList
                data={filteredTasks}
                renderItem={renderTask}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={refreshTasks}
                        colors={[theme.primary]}
                        tintColor={theme.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                            No se encontraron tareas
                        </Text>
                    </View>
                }
            />

            <FAB
                style={[styles.fab, { backgroundColor: theme.primary }]}
                color={theme.onPrimary}
                icon="plus"
                onPress={() => navigation.navigate('CreateTask')}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    filterContainer: {
        flexGrow: 0,
        paddingVertical: 12,
    },
    filterContent: {
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    filterChip: {
        marginRight: 8,
        height: 36, // Fixed height to prevent jumping
    },
    listContent: {
        padding: 16,
    },
    taskCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
    },
    taskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    taskTitle: {
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
        marginRight: 8,
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    priorityText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    taskDescription: {
        fontSize: 14,
        marginBottom: 12,
    },
    taskFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusChip: {
        height: 32,
    },
    dueDate: {
        fontSize: 13,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 16,
    },
    fab: {
        position: 'absolute',
        right: 16,
        bottom: 16,
    },
});
