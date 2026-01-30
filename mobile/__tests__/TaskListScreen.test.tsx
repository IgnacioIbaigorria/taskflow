import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TaskListScreen from '../src/screens/TaskListScreen';
import { Task } from '../src/models/Task';

// Mocks
jest.mock('../src/contexts/TaskContext', () => ({
    useTasks: () => ({
        tasks: [
            {
                id: '1',
                title: 'Test Task',
                description: 'Description',
                status: 'pending',
                priority: 'medium',
                created_by: 'user1',
                created_at: '2024-01-01',
                due_date: '2023-01-01T20:00:00Z', // Past date for overdue test
            } as Task,
            {
                id: '2',
                title: 'Future Task',
                status: 'pending',
                priority: 'high',
                created_at: '2024-01-02',
                due_date: '2099-01-01T20:00:00Z',
            } as Task,
        ],
        loading: false,
        isOffline: false,
        filter: {},
        setFilter: jest.fn(),
        refreshTasks: jest.fn(),
    }),
}));

jest.mock('../src/contexts/ThemeContext', () => ({
    useTheme: () => ({
        theme: {
            background: '#ffffff',
            text: '#000000',
            card: '#f0f0f0',
            primary: '#6200ee',
            error: '#B00020',
        },
    }),
}));

const mockNavigation = {
    navigate: jest.fn(),
};

describe('TaskListScreen', () => {
    it('renders tasks correctly', () => {
        const { getByText } = render(<TaskListScreen navigation={mockNavigation} />);

        expect(getByText('Test Task')).toBeTruthy();
        expect(getByText('Future Task')).toBeTruthy();
    });

    it('shows overdue status for past due tasks', () => {
        const { getByText } = render(<TaskListScreen navigation={mockNavigation} />);

        // Should find "Venció:" for the past task
        // Note: The text might be split or part of a larger string, but we check for the label
        expect(getByText(/Venció:/)).toBeTruthy();
    });

    it('navigates to detail on press', () => {
        const { getByText } = render(<TaskListScreen navigation={mockNavigation} />);

        fireEvent.press(getByText('Test Task'));
        expect(mockNavigation.navigate).toHaveBeenCalledWith('TaskDetail', { taskId: '1' });
    });
});
