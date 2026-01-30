import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { FAB, Chip, Text, Searchbar, Banner, IconButton } from 'react-native-paper';
import { useTasks } from '../contexts/TaskContext';
import { useTheme } from '../contexts/ThemeContext';
import { Task, TaskStatus, STATUS_LABELS, PRIORITY_LABELS } from '../models/Task';
import { priorityColors, statusColors } from '../theme/colors';

export default function TaskListScreen({ navigation }: any) {
    const { tasks, loading, isOffline, filter, setFilter, refreshTasks } = useTasks();
    const { theme } = useTheme();
    const [selectedStatus, setSelectedStatus] = useState<TaskStatus | undefined>();
    const [sortMenuVisible, setSortMenuVisible] = useState(false);
    const [pendingSorts, setPendingSorts] = useState<{ key: string, order: 'asc' | 'desc' }[]>([]);

    // Initialize pending sorts when menu opens
    React.useEffect(() => {
        if (sortMenuVisible) {
            if (filter.sort_by) {
                const keys = filter.sort_by.split(',');
                const orders = (filter.sort_order || '').split(',');
                const sorts = keys.map((k, i) => ({
                    key: k.trim(),
                    order: (orders[i] ? orders[i].trim() : 'asc') as 'asc' | 'desc'
                }));
                setPendingSorts(sorts);
            } else {
                setPendingSorts([]);
            }
        }
    }, [sortMenuVisible]);


    const filteredTasks = React.useMemo(() => {
        const result = selectedStatus
            ? tasks.filter(t => t.status === selectedStatus)
            : [...tasks];

        const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

        return result.sort((a, b) => {
            // Dynamic Sort based on filter (Support Multi-Column)
            if (filter.sort_by) {
                const keys = filter.sort_by.split(',');
                const orders = (filter.sort_order || '').split(',');

                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i].trim();
                    // Default to first order if index exceeds, or 'asc'
                    const orderStr = (orders[i] || orders[0] || 'asc').trim();
                    const direction = orderStr === 'desc' ? -1 : 1;

                    if (key === 'due_date') {
                        // Due Date Sort (Group by Day)
                        if (a.due_date && b.due_date) {
                            const dateA = new Date(a.due_date).toISOString().split('T')[0];
                            const dateB = new Date(b.due_date).toISOString().split('T')[0];
                            if (dateA < dateB) return -1 * direction;
                            if (dateA > dateB) return 1 * direction;
                            // If equal dates, continue to next sort key
                        } else {
                            if (a.due_date && !b.due_date) return -1; // Nulls last
                            if (!a.due_date && b.due_date) return 1;
                            // Both null, continue
                        }
                    } else if (key === 'priority') {
                        // Priority Sort: Urgent(0) -> Low(3)
                        const pA = priorityOrder[a.priority] ?? 2;
                        const pB = priorityOrder[b.priority] ?? 2;
                        if (pA !== pB) return (pA - pB) * direction;
                    } else if (key === 'created_at') {
                        // Created At Sort
                        const dateA = new Date(a.created_at).getTime();
                        const dateB = new Date(b.created_at).getTime();
                        if (dateA !== dateB) return (dateA - dateB) * direction;
                    }
                }
                // If all specified keys are equal, fallback to ID for stability
                return a.id.localeCompare(b.id);
            }

            // Default Sort: DueDate(Day) -> Priority -> CreatedAt
            // 1. Sort by Due Date (Ascending), nulls last
            // If both have due_date
            if (a.due_date && b.due_date) {
                // Compare only the YYYY-MM-DD part to group by day
                const dateA = new Date(a.due_date).toISOString().split('T')[0];
                const dateB = new Date(b.due_date).toISOString().split('T')[0];
                if (dateA < dateB) return -1;
                if (dateA > dateB) return 1;
            }
            // If only a has due_date, it comes first
            if (a.due_date && !b.due_date) return -1;
            // If only b has due_date, it comes first
            if (!a.due_date && b.due_date) return 1;

            // 2. Sort by Priority (Urgent > High > Medium > Low)
            const pA = priorityOrder[a.priority] ?? 2;
            const pB = priorityOrder[b.priority] ?? 2;

            if (pA !== pB) return pA - pB;

            // 3. Secondary sort: Newest first (Created At)
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    }, [tasks, selectedStatus, filter.sort_by, filter.sort_order]);

    const handleTaskPress = (task: Task) => {
        navigation.navigate('TaskDetail', { taskId: task.id });
    };


    const handleFilterChange = (status?: TaskStatus) => {
        setSelectedStatus(status);
        setFilter({ ...filter, status, page: 1 });
    };

    const toggleSort = (key: string, order: 'asc' | 'desc') => {
        setPendingSorts(prev => {
            // Check if exact match exists
            const existingIndex = prev.findIndex(s => s.key === key && s.order === order);

            if (existingIndex >= 0) {
                // Remove if matches exactly
                return prev.filter((_, i) => i !== existingIndex);
            }

            // Remove any existing entry for this key (cannot sort by same key twice)
            const clean = prev.filter(s => s.key !== key);
            // Append new selection
            return [...clean, { key, order }];
        });
    };

    const handleApplySort = () => {
        const keys = pendingSorts.map(s => s.key).join(',');
        const orders = pendingSorts.map(s => s.order).join(',');
        setFilter({ ...filter, sort_by: keys || undefined, sort_order: orders || undefined, page: 1 });
        setSortMenuVisible(false);
        refreshTasks();
    };

    const getSortIndex = (key: string, order: 'asc' | 'desc') => {
        const index = pendingSorts.findIndex(s => s.key === key && s.order === order);
        return index >= 0 ? index + 1 : null;
    };

    const handleLoadMore = () => {
        const page = filter.page || 1;
        const pageSize = filter.page_size || 20;
        if (!loading && tasks.length >= page * pageSize) {
            setFilter({ ...filter, page: page + 1 });
        }
    };

    const renderFooter = () => {
        if (!loading) return null;
        return (
            <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator animating size="small" color={theme.primary} />
            </View>
        );
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

            <View style={styles.assignedToContainer}>
                <Text style={[styles.assignedTo, { color: theme.textSecondary }]}>
                    Asignada a: {item.assignee?.name || 'Sin asignar'}
                </Text>
            </View>

            <View style={styles.taskFooter}>
                <Chip
                    mode="outlined"
                    style={[styles.statusChip, { borderColor: statusColors[item.status] }]}
                    textStyle={{ color: statusColors[item.status], fontSize: 13 }}
                >
                    {STATUS_LABELS[item.status]}
                </Chip>

                {item.due_date && (() => {
                    const dueDate = new Date(item.due_date);
                    const isOverdue = dueDate < new Date() && item.status !== 'completed' && item.status !== 'cancelled';
                    return (
                        <Text style={[
                            styles.dueDate,
                            { color: isOverdue ? theme.error : theme.textSecondary }
                        ]}>
                            {isOverdue ? 'Venció: ' : 'Vence: '}
                            {dueDate.toLocaleString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                year: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                            })}
                        </Text>
                    );
                })()}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>

            {isOffline && (
                <Banner
                    visible={true}
                    style={styles.banner}
                    theme={{ colors: { onSurface: theme.error } }}
                >
                    Sin conexión a internet. Mostrando tareas en caché.
                </Banner>
            )}

            <View style={styles.headerControls}>
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

                <IconButton
                    icon="sort"
                    iconColor={theme.primary}
                    onPress={() => setSortMenuVisible(true)}
                />

                <Modal
                    visible={sortMenuVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setSortMenuVisible(false)}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setSortMenuVisible(false)}
                    >
                        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <Text style={[styles.modalTitle, { color: theme.text, marginBottom: 0 }]}>Ordenar por</Text>
                                {pendingSorts.length > 0 && (
                                    <TouchableOpacity onPress={() => setPendingSorts([])}>
                                        <Text style={{ color: theme.error }}>Limpiar</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <Text style={{ color: theme.textSecondary, marginBottom: 10, fontSize: 12 }}>
                                Selecciona varios campos en orden de prioridad.
                            </Text>

                            {/* Vencimiento */}
                            <TouchableOpacity
                                style={[styles.modalOption, getSortIndex('due_date', 'asc') !== null && { backgroundColor: theme.primary + '20' }]}
                                onPress={() => toggleSort('due_date', 'asc')}
                            >
                                <View style={styles.optionRow}>
                                    <Text style={{ color: theme.text, flex: 1 }}>Vencimiento: Más cercanos</Text>
                                    {getSortIndex('due_date', 'asc') && (
                                        <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                                            <Text style={styles.badgeText}>{getSortIndex('due_date', 'asc')}</Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalOption, getSortIndex('due_date', 'desc') !== null && { backgroundColor: theme.primary + '20' }]}
                                onPress={() => toggleSort('due_date', 'desc')}
                            >
                                <View style={styles.optionRow}>
                                    <Text style={{ color: theme.text, flex: 1 }}>Vencimiento: Más lejanos</Text>
                                    {getSortIndex('due_date', 'desc') && (
                                        <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                                            <Text style={styles.badgeText}>{getSortIndex('due_date', 'desc')}</Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>

                            <View style={[styles.modalDivider, { backgroundColor: theme.border }]} />

                            {/* Prioridad */}
                            <TouchableOpacity
                                style={[styles.modalOption, getSortIndex('priority', 'asc') !== null && { backgroundColor: theme.primary + '20' }]}
                                onPress={() => toggleSort('priority', 'asc')}
                            >
                                <View style={styles.optionRow}>
                                    <Text style={{ color: theme.text, flex: 1 }}>Prioridad: Urgente a Baja</Text>
                                    {getSortIndex('priority', 'asc') && (
                                        <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                                            <Text style={styles.badgeText}>{getSortIndex('priority', 'asc')}</Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalOption, getSortIndex('priority', 'desc') !== null && { backgroundColor: theme.primary + '20' }]}
                                onPress={() => toggleSort('priority', 'desc')}
                            >
                                <View style={styles.optionRow}>
                                    <Text style={{ color: theme.text, flex: 1 }}>Prioridad: Baja a Urgente</Text>
                                    {getSortIndex('priority', 'desc') && (
                                        <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                                            <Text style={styles.badgeText}>{getSortIndex('priority', 'desc')}</Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>

                            <View style={[styles.modalDivider, { backgroundColor: theme.border }]} />

                            {/* Creacion */}
                            <TouchableOpacity
                                style={[styles.modalOption, getSortIndex('created_at', 'desc') !== null && { backgroundColor: theme.primary + '20' }]}
                                onPress={() => toggleSort('created_at', 'desc')}
                            >
                                <View style={styles.optionRow}>
                                    <Text style={{ color: theme.text, flex: 1 }}>Creación: Más nuevos</Text>
                                    {getSortIndex('created_at', 'desc') && (
                                        <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                                            <Text style={styles.badgeText}>{getSortIndex('created_at', 'desc')}</Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalOption, getSortIndex('created_at', 'asc') !== null && { backgroundColor: theme.primary + '20' }]}
                                onPress={() => toggleSort('created_at', 'asc')}
                            >
                                <View style={styles.optionRow}>
                                    <Text style={{ color: theme.text, flex: 1 }}>Creación: Más viejos</Text>
                                    {getSortIndex('created_at', 'asc') && (
                                        <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                                            <Text style={styles.badgeText}>{getSortIndex('created_at', 'asc')}</Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalOption, styles.modalApplyButton, { backgroundColor: theme.primary }]}
                                onPress={handleApplySort}
                            >
                                <Text style={{ color: theme.onPrimary, fontWeight: 'bold', textAlign: 'center' }}>Aplicar Orden</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalOption, styles.modalCancel]}
                                onPress={() => setSortMenuVisible(false)}
                            >
                                <Text style={{ color: theme.error }}>Cancelar</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>
            </View>

            <FlatList
                data={filteredTasks}
                renderItem={renderTask}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={loading && filter.page === 1}
                        onRefresh={refreshTasks}
                        colors={[theme.primary]}
                        tintColor={theme.primary}
                    />
                }
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                                No se encontraron tareas
                            </Text>
                        </View>
                    ) : null
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
        flexGrow: 1,
        paddingVertical: 12,
    },
    headerControls: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 8,
    },
    filterContent: {
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    filterChip: {
        marginRight: 8,
        height: 36, // Fixed height to prevent jumping
    },
    banner: {
        margin: 8,
        borderRadius: 8,
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
    assignedToContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    assignedTo: {
        fontSize: 14,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        borderRadius: 12,
        padding: 16,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    modalOption: {
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    modalDivider: {
        height: 1,
        marginVertical: 4,
    },
    modalCancel: {
        marginTop: 0,
        alignItems: 'center',
    },
    modalApplyButton: {
        marginTop: 16,
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    badge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
});
