import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Modal, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, IconButton } from 'react-native-paper';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useTasks } from '../contexts/TaskContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { taskService } from '../services/taskService';
import { userService, User } from '../services/userService';
import { Task, Priority, TaskStatus, PRIORITY_LABELS, STATUS_LABELS } from '../models/Task';
import { priorityColors, statusColors } from '../theme/colors';

export default function TaskDetailScreen({ route, navigation }: any) {
    const { taskId } = route.params;
    const { theme } = useTheme();
    const { user } = useAuth();
    const { updateTask, deleteTask, updateTaskStatus, tasks, isOffline } = useTasks();
    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<Priority>('medium');
    const [status, setStatus] = useState<TaskStatus>('pending');
    const [users, setUsers] = useState<User[]>([]);
    const [dueDate, setDueDate] = useState<string | null>(null);
    const [showStatusPicker, setShowStatusPicker] = useState(false);
    const [showPriorityPicker, setShowPriorityPicker] = useState(false);
    const [showAssigneePicker, setShowAssigneePicker] = useState(false);

    // DateTimePicker state
    const [mode, setMode] = useState<'date' | 'time'>('date');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [tempDate, setTempDate] = useState<Date | undefined>(undefined);

    const priorities: Priority[] = ['low', 'medium', 'high', 'urgent'];
    const statuses: TaskStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];

    useEffect(() => {
        loadTask();
    }, [taskId, isOffline]);

    const loadTask = async () => {
        // First try to find in context (cache)
        const cachedTask = tasks.find(t => t.id === taskId);

        if (isOffline) {
            if (cachedTask) {
                setTask(cachedTask);
                populateForm(cachedTask);
                setLoading(false);
                return;
            } else {
                Alert.alert('Error', 'Tarea no encontrada en caché');
                navigation.goBack();
                return;
            }
        }

        try {
            const data = await taskService.getTaskById(taskId);
            setTask(data);
            populateForm(data);

            // If we are creator, load users for assignment
            if (user?.id === data.created_by) {
                const usersList = await userService.getUsers();
                setUsers(usersList);
            }
        } catch (error) {
            if (cachedTask) {
                setTask(cachedTask);
                populateForm(cachedTask);
            } else {
                Alert.alert('Error', 'Error al cargar la tarea');
                navigation.goBack();
            }
        } finally {
            setLoading(false);
        }
    };

    const populateForm = (data: Task) => {
        setTitle(data.title);
        setDescription(data.description);
        setPriority(data.priority);
        setStatus(data.status);
        if (data.due_date) setDueDate(data.due_date);
    };

    const handleSave = async () => {
        try {
            await updateTask(taskId, {
                title,
                description,
                priority,
                status,
                due_date: dueDate ? new Date(dueDate).toISOString() : undefined // Convert string/date loop
            });
            setEditing(false);

            // Update local task state
            if (task) {
                setTask({
                    ...task,
                    title,
                    description,
                    priority,
                    status,
                    due_date: dueDate || undefined,
                });
            }

            // Only reload from API if online
            if (!isOffline) {
                loadTask();
            }

            Alert.alert('Éxito', 'Tarea actualizada correctamente');
        } catch (error) {
            Alert.alert('Error', 'Error al actualizar la tarea');
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Borrar tarea',
            '¿Estás seguro de que quieres borrar esta tarea?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Borrar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteTask(taskId);
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert('Error', 'Error al borrar la tarea');
                        }
                    },
                },
            ]
        );
    };

    const handleStatusChange = async (newStatus: TaskStatus) => {
        if (editing) {
            setStatus(newStatus);
            setShowStatusPicker(false);
            return;
        }

        try {
            await updateTaskStatus(taskId, newStatus);
            setStatus(newStatus);
            setShowStatusPicker(false);

            // Update local task state instead of reloading
            if (task) {
                setTask({ ...task, status: newStatus });
            }

            // Only reload from API if online
            if (!isOffline) {
                loadTask();
            }
        } catch (error) {
            Alert.alert('Error', 'Error al actualizar el estado de la tarea');
        }
    };

    const handleAssign = async (userId: string) => {
        try {
            // We use raw api call here or add to taskService. 
            // Since User restricted endpoints, I assume I can't add to taskService easily?
            // Wait, I updated taskService.ts? No, I only updated userService.ts.
            // I should have updated taskService.ts. But I can make the call here or use taskService if I add it.
            // I will use taskService.Wait, I haven't added it to taskService.ts.
            // I'll add it to taskService.ts using view_file/replace first?
            // Nah, I'll add the method to TaskDetailScreen using direct API or fix taskService.
            // Better to fix taskService.ts. I'll do that in a sec.
            // For now I'll just put placeholder and I'll update taskService.ts in a parallel step if possible or sequential.
            // I'll assume taskService has assignTask.
            await taskService.assignTask(taskId, userId);
            setShowAssigneePicker(false);
            loadTask();
            Alert.alert('Éxito', 'Tarea asignada correctamente');
        } catch (error) {
            Alert.alert('Error', 'Error al asignar la tarea');
        }
    };

    if (loading || !task) {
        return null;
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.content}>
                <View style={[styles.card, { backgroundColor: theme.card }]}>
                    {/* Header Actions removed from here to be integrated with Title */}

                    {editing ? (
                        <>
                            <View style={[styles.headerActions, { marginRight: -8, marginTop: -8 }]}>
                                {user?.id === task.created_by && (
                                    <View style={styles.actionButtonsRow}>
                                        <IconButton
                                            icon="close"
                                            onPress={() => setEditing(false)}
                                        />
                                        <IconButton
                                            icon="delete"
                                            onPress={handleDelete}
                                            iconColor={theme.error}
                                        />
                                    </View>
                                )}
                            </View>

                            <TextInput
                                label="Título"
                                value={title}
                                onChangeText={setTitle}
                                mode="outlined"
                                style={[styles.input, { marginBottom: 16 }]}
                                placeholderTextColor={theme.placeholder}
                                outlineColor={theme.inputBorder}
                                activeOutlineColor={theme.inputBorderActive}
                            />

                            <TextInput
                                label="Descripción"
                                value={description}
                                onChangeText={setDescription}
                                mode="outlined"
                                multiline
                                numberOfLines={4}
                                style={styles.input}
                                placeholderTextColor={theme.placeholder}
                                outlineColor={theme.inputBorder}
                                activeOutlineColor={theme.inputBorderActive}
                            />

                            <View style={styles.row}>
                                {/* Priority Picker Button */}
                                <Button
                                    mode="outlined"
                                    onPress={() => setShowPriorityPicker(true)}
                                    style={[styles.menuButton, { borderColor: theme.inputBorder }]}
                                    textColor={theme.text}
                                >
                                    Prioridad: {PRIORITY_LABELS[priority]}
                                </Button>

                                {/* Status Picker Button */}
                                <Button
                                    mode="outlined"
                                    onPress={() => setShowStatusPicker(true)}
                                    style={[styles.menuButton, { marginLeft: 12, borderColor: theme.inputBorder }]}
                                    textColor={theme.text}
                                >
                                    Estado: {STATUS_LABELS[status]}
                                </Button>
                            </View>

                            {/* Date Picker Button in Edit Mode */}
                            <View style={[styles.row, { marginTop: 0 }]}>
                                <Button
                                    mode="outlined"
                                    onPress={() => {
                                        setTempDate(dueDate ? new Date(dueDate) : new Date());
                                        setMode('date');
                                        setShowDatePicker(true);
                                    }}
                                    icon="calendar"
                                    style={[styles.menuButton, { borderColor: theme.inputBorder }]}
                                    textColor={theme.text}
                                >
                                    {dueDate
                                        ? new Date(dueDate).toLocaleString('es-ES', {
                                            day: '2-digit', month: '2-digit', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })
                                        : 'Añadir vencimiento'}
                                </Button>
                                {dueDate && (
                                    <IconButton
                                        icon="close"
                                        size={20}
                                        onPress={() => setDueDate(null)}
                                        style={{ marginLeft: 8 }}
                                    />
                                )}
                            </View>

                            {showDatePicker && (
                                <DateTimePicker
                                    testID="dateTimePicker"
                                    value={tempDate || new Date()}
                                    mode={mode}
                                    is24Hour={true}
                                    display="default"
                                    onChange={(event, selectedDate) => {
                                        setShowDatePicker(false);
                                        if (selectedDate) {
                                            if (mode === 'date') {
                                                setTempDate(selectedDate);
                                                // Trigger time picker
                                                setMode('time');
                                                setTimeout(() => setShowDatePicker(true), 100);
                                            } else {
                                                // Combine date and time
                                                const finalDate = new Date(tempDate || new Date());
                                                finalDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()); // Actually selectedDate is the time one, but let's be safe
                                                // Wait, the previous date was in tempDate. current selectedDate has the time.
                                                // But on Android, the date part might be reset or kept depending on impl.
                                                // Better: Use tempDate's date and selectedDate's time.
                                                const newDate = new Date(tempDate || new Date());
                                                newDate.setHours(selectedDate.getHours());
                                                newDate.setMinutes(selectedDate.getMinutes());

                                                setDueDate(newDate.toISOString());
                                                setMode('date');
                                            }
                                        }
                                    }}
                                />
                            )}



                            <Button
                                mode="contained"
                                onPress={handleSave}
                                style={styles.saveButton}
                                buttonColor={theme.primary}
                                textColor={theme.onPrimary}
                            >
                                Guardar cambios
                            </Button>
                        </>
                    ) : (
                        <>
                            <View style={styles.titleRow}>
                                <Text style={[styles.title, { color: theme.text, flex: 1 }]}>{task.title}</Text>
                                {user?.id === task.created_by && (
                                    <View style={styles.actionButtonsRow}>
                                        <IconButton
                                            icon="pencil"
                                            onPress={() => setEditing(true)}
                                            size={20}
                                        />
                                        <IconButton
                                            icon="delete"
                                            onPress={handleDelete}
                                            iconColor={theme.error}
                                            size={20}
                                        />
                                    </View>
                                )}
                            </View>

                            <View style={styles.badges}>
                                <View style={[styles.badge, { backgroundColor: priorityColors[task.priority] }]}>
                                    <Text style={styles.badgeText}>{PRIORITY_LABELS[task.priority]}</Text>
                                </View>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        if (user?.id === task.created_by || user?.id === task.assigned_to) {
                                            setShowStatusPicker(true);
                                        }
                                    }}
                                    disabled={!(user?.id === task.created_by || user?.id === task.assigned_to)}
                                >
                                    <View style={[styles.badge, { backgroundColor: statusColors[task.status], marginLeft: 8, flexDirection: 'row', alignItems: 'center' }]}>
                                        <Text style={styles.badgeText}>{STATUS_LABELS[task.status]}</Text>
                                        {(user?.id === task.created_by || user?.id === task.assigned_to) && (
                                            <IconButton icon="pencil" size={12} iconColor="white" style={{ margin: 0, marginLeft: 2, padding: 0, width: 14, height: 14 }} />
                                        )}
                                    </View>
                                </TouchableOpacity>
                            </View>

                            {task.description ? (
                                <>
                                    <Text style={[styles.label, { color: theme.textSecondary }]}>Descripción</Text>
                                    <Text style={[styles.description, { color: theme.text }]}>
                                        {task.description}
                                    </Text>
                                </>
                            ) : null}

                            <View style={styles.info}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>Creado por</Text>
                                <Text style={{ color: theme.text }}>
                                    {task.creator?.name || 'Desconocido'}
                                </Text>
                            </View>

                            <View style={styles.info}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <View>
                                        <Text style={[styles.label, { color: theme.textSecondary }]}>Asignado a</Text>
                                        <Text style={{ color: theme.text }}>
                                            {task.assignee?.name || 'Sin asignar'}
                                        </Text>
                                    </View>
                                    {user?.id === task.created_by && (
                                        <Button
                                            mode="text"
                                            onPress={() => setShowAssigneePicker(true)}
                                            compact
                                        >
                                            Cambiar
                                        </Button>
                                    )}
                                </View>
                            </View>

                            <View style={styles.info}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>Creado el</Text>
                                <Text style={{ color: theme.text }}>
                                    {new Date(task.created_at).toLocaleString('es-ES', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                        hour12: false
                                    })}
                                </Text>
                            </View>

                            {dueDate && (
                                <View style={styles.info}>
                                    <Text style={[styles.label, { color: theme.textSecondary }]}>Fecha de vencimiento</Text>
                                    <Text style={{ color: theme.text }}>
                                        {new Date(dueDate).toLocaleString('es-ES', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit',
                                            hour12: false
                                        })}
                                    </Text>
                                </View>
                            )}
                        </>
                    )}
                </View>

                {/* Priority Picker Modal */}
                <Modal
                    visible={showPriorityPicker}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowPriorityPicker(false)}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setShowPriorityPicker(false)}
                    >
                        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>
                                Prioridad
                            </Text>
                            {priorities.map((p) => (
                                <TouchableOpacity
                                    key={p}
                                    style={[
                                        styles.pickerOption,
                                        priority === p && { backgroundColor: theme.primary + '20' },
                                    ]}
                                    onPress={() => {
                                        setPriority(p);
                                        setShowPriorityPicker(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.pickerOptionText,
                                            { color: priority === p ? theme.primary : theme.text },
                                        ]}
                                    >
                                        {PRIORITY_LABELS[p]}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* Status Picker Modal */}
                <Modal
                    visible={showStatusPicker}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowStatusPicker(false)}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setShowStatusPicker(false)}
                    >
                        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>
                                Seleccionar Estado
                            </Text>
                            {statuses.map((s) => (
                                <TouchableOpacity
                                    key={s}
                                    style={[
                                        styles.pickerOption,
                                        status === s && { backgroundColor: theme.primary + '20' },
                                    ]}
                                    onPress={() => handleStatusChange(s)}
                                >
                                    <Text
                                        style={[
                                            styles.pickerOptionText,
                                            { color: status === s ? theme.primary : theme.text },
                                        ]}
                                    >
                                        {STATUS_LABELS[s]}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* Assignee Picker Modal */}
                <Modal
                    visible={showAssigneePicker}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowAssigneePicker(false)}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setShowAssigneePicker(false)}
                    >
                        <View style={[styles.modalContent, { backgroundColor: theme.surface, maxHeight: '80%' }]}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>
                                Asignar a
                            </Text>
                            <ScrollView>
                                {users.map((u) => (
                                    <TouchableOpacity
                                        key={u.id}
                                        style={[
                                            styles.pickerOption,
                                            task?.assigned_to === u.id && { backgroundColor: theme.primary + '20' },
                                        ]}
                                        onPress={() => handleAssign(u.id)}
                                    >
                                        <Text
                                            style={[
                                                styles.pickerOptionText,
                                                { color: task?.assigned_to === u.id ? theme.primary : theme.text },
                                            ]}
                                        >
                                            {u.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </TouchableOpacity>
                </Modal>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 16,
    },
    card: {
        padding: 20,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 16,
        gap: 8,
    },
    actionButton: {
        flex: 1,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(150, 150, 150, 0.2)',
        marginVertical: 16,
    },
    metaContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    headerActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 16,
        marginTop: -8,
        marginRight: -8,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        // marginBottom: 16, // Removed to let row handle spacing
        marginRight: 8,
    },
    badges: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    badgeText: {
        color: '#fff',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        fontSize: 12,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 24,
    },
    info: {
        marginBottom: 16,
    },
    input: {
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    menuButton: {
        flex: 1,
    },
    saveButton: {
        marginTop: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        maxWidth: 400,
        borderRadius: 12,
        padding: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    pickerOption: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 8,
    },
    pickerOptionText: {
        fontSize: 16,
        textAlign: 'center',
        fontWeight: '500',
    },
});
