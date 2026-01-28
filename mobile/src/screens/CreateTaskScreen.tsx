import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Modal, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useTheme } from '../contexts/ThemeContext';
import { useTasks } from '../contexts/TaskContext';
import { Priority, PRIORITY_LABELS } from '../models/Task';

export default function CreateTaskScreen({ navigation }: any) {
    const { theme } = useTheme();
    const { createTask } = useTasks();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<Priority>('medium');
    const [showPriorityPicker, setShowPriorityPicker] = useState(false);
    const [loading, setLoading] = useState(false);

    const priorities: Priority[] = ['low', 'medium', 'high', 'urgent'];

    const handleCreate = async () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Por favor, ingresa un título');
            return;
        }

        try {
            setLoading(true);
            await createTask({
                title: title.trim(),
                description: description.trim(),
                priority,
            });
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', 'Error al crear la tarea');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.content}>
                <View style={[styles.card, { backgroundColor: theme.card }]}>
                    <Text style={[styles.heading, { color: theme.text }]}>Nueva tarea</Text>
                    <TextInput
                        label="Título *"
                        value={title}
                        onChangeText={setTitle}
                        mode="outlined"
                        style={styles.input}
                        maxLength={100}
                        placeholder="Título"
                        placeholderTextColor={theme.placeholder}
                        outlineColor={theme.inputBorder}
                        activeOutlineColor={theme.inputBorderActive}
                        theme={{
                            colors: {
                                background: theme.card
                            }
                        }}
                    />

                    <TextInput
                        label="Descripción"
                        value={description}
                        onChangeText={setDescription}
                        mode="outlined"
                        multiline
                        numberOfLines={4}
                        style={styles.input}
                        maxLength={500}
                        placeholder="Descripción de tarea"
                        placeholderTextColor={theme.placeholder}
                        outlineColor={theme.inputBorder}
                        activeOutlineColor={theme.inputBorderActive}
                        theme={{
                            colors: {
                                background: theme.card
                            }
                        }}
                    />

                    {/* Priority Picker Button */}
                    <Button
                        mode="outlined"
                        onPress={() => setShowPriorityPicker(true)}
                        style={[styles.priorityButton, { borderColor: theme.inputBorder }]}
                        textColor={theme.text}
                    >
                        Prioridad: {PRIORITY_LABELS[priority]}
                    </Button>

                    <View style={styles.buttons}>
                        <Button
                            mode="outlined"
                            onPress={() => navigation.goBack()}
                            style={[styles.button, { marginLeft: 0, marginRight: 6, borderColor: theme.inputBorder }]}
                            disabled={loading}
                            textColor={theme.text}
                        >
                            Cancel
                        </Button>

                        <Button
                            mode="contained"
                            onPress={handleCreate}
                            style={styles.button}
                            loading={loading}
                            disabled={loading}
                            buttonColor={theme.primary}
                            textColor={theme.onPrimary}
                        >
                            Crear
                        </Button>
                    </View>
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
                                        styles.priorityOption,
                                        priority === p && { backgroundColor: theme.primary + '20' },
                                    ]}
                                    onPress={() => {
                                        setPriority(p);
                                        setShowPriorityPicker(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.priorityOptionText,
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
    heading: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 24,
        textAlign: 'center',
    },
    input: {
        marginBottom: 16,
        backgroundColor: 'transparent',
    },
    priorityButton: {
        marginBottom: 24,
        borderRadius: 8,
    },
    buttons: {
        flexDirection: 'row',
        marginTop: 8,
    },
    button: {
        flex: 1,
        marginLeft: 6,
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
    priorityOption: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 8,
    },
    priorityOptionText: {
        fontSize: 16,
        textAlign: 'center',
        fontWeight: '500',
    },
});
