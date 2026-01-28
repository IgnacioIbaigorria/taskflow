package services

import (
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/taskflow/backend/internal/models"
)

// MockTaskRepository is a mock implementation of TaskRepository
type MockTaskRepository struct {
	mock.Mock
}

func (m *MockTaskRepository) Create(task *models.Task) error {
	args := m.Called(task)
	return args.Error(0)
}

func (m *MockTaskRepository) FindByID(id uuid.UUID) (*models.Task, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Task), args.Error(1)
}

func (m *MockTaskRepository) Update(task *models.Task) error {
	args := m.Called(task)
	return args.Error(0)
}

func (m *MockTaskRepository) Delete(id uuid.UUID) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockTaskRepository) List(filter models.TaskFilter) ([]models.Task, int64, error) {
	args := m.Called(filter)
	return args.Get(0).([]models.Task), args.Get(1).(int64), args.Error(2)
}

func (m *MockTaskRepository) UpdateStatus(id uuid.UUID, status models.TaskStatus) error {
	args := m.Called(id, status)
	return args.Error(0)
}

func (m *MockTaskRepository) AssignTask(taskID, userID uuid.UUID) error {
	args := m.Called(taskID, userID)
	return args.Error(0)
}

func TestCreateTask_Success(t *testing.T) {
	mockTaskRepo := new(MockTaskRepository)
	mockUserRepo := new(MockUserRepository)
	service := NewTaskService(mockTaskRepo, mockUserRepo)

	userID := uuid.New()
	req := CreateTaskRequest{
		Title:       "Test Task",
		Description: "Test Description",
		Priority:    models.PriorityHigh,
	}

	expectedTask := &models.Task{
		ID:          uuid.New(),
		Title:       req.Title,
		Description: req.Description,
		Priority:    req.Priority,
		Status:      models.TaskStatusPending,
		CreatedBy:   userID,
	}

	mockTaskRepo.On("Create", mock.AnythingOfType("*models.Task")).Return(nil)
	mockTaskRepo.On("FindByID", mock.AnythingOfType("uuid.UUID")).Return(expectedTask, nil)

	task, err := service.Create(userID, req)

	assert.NoError(t, err)
	assert.NotNil(t, task)
	assert.Equal(t, req.Title, task.Title)
	assert.Equal(t, models.TaskStatusPending, task.Status)
	mockTaskRepo.AssertExpectations(t)
}

func TestUpdateTask_Success(t *testing.T) {
	mockTaskRepo := new(MockTaskRepository)
	mockUserRepo := new(MockUserRepository)
	service := NewTaskService(mockTaskRepo, mockUserRepo)

	userID := uuid.New()
	taskID := uuid.New()
	newTitle := "Updated Title"

	existingTask := &models.Task{
		ID:        taskID,
		Title:     "Old Title",
		CreatedBy: userID,
	}

	req := UpdateTaskRequest{
		Title: &newTitle,
	}

	mockTaskRepo.On("FindByID", taskID).Return(existingTask, nil).Times(2)
	mockTaskRepo.On("Update", mock.AnythingOfType("*models.Task")).Return(nil)

	task, err := service.Update(taskID, userID, req)

	assert.NoError(t, err)
	assert.NotNil(t, task)
	mockTaskRepo.AssertExpectations(t)
}

func TestUpdateTask_Unauthorized(t *testing.T) {
	mockTaskRepo := new(MockTaskRepository)
	mockUserRepo := new(MockUserRepository)
	service := NewTaskService(mockTaskRepo, mockUserRepo)

	userID := uuid.New()
	otherUserID := uuid.New()
	taskID := uuid.New()
	newTitle := "Updated Title"

	existingTask := &models.Task{
		ID:        taskID,
		Title:     "Old Title",
		CreatedBy: otherUserID, // Different user
	}

	req := UpdateTaskRequest{
		Title: &newTitle,
	}

	mockTaskRepo.On("FindByID", taskID).Return(existingTask, nil)

	task, err := service.Update(taskID, userID, req)

	assert.Error(t, err)
	assert.Nil(t, task)
	assert.Equal(t, "unauthorized to update this task", err.Error())
	mockTaskRepo.AssertExpectations(t)
}

func TestDeleteTask_Success(t *testing.T) {
	mockTaskRepo := new(MockTaskRepository)
	mockUserRepo := new(MockUserRepository)
	service := NewTaskService(mockTaskRepo, mockUserRepo)

	userID := uuid.New()
	taskID := uuid.New()

	existingTask := &models.Task{
		ID:        taskID,
		CreatedBy: userID,
	}

	mockTaskRepo.On("FindByID", taskID).Return(existingTask, nil)
	mockTaskRepo.On("Delete", taskID).Return(nil)

	err := service.Delete(taskID, userID)

	assert.NoError(t, err)
	mockTaskRepo.AssertExpectations(t)
}

func TestUpdateStatus_Success(t *testing.T) {
	mockTaskRepo := new(MockTaskRepository)
	mockUserRepo := new(MockUserRepository)
	service := NewTaskService(mockTaskRepo, mockUserRepo)

	userID := uuid.New()
	taskID := uuid.New()
	newStatus := models.TaskStatusCompleted

	existingTask := &models.Task{
		ID:        taskID,
		CreatedBy: userID,
		Status:    models.TaskStatusInProgress,
	}

	mockTaskRepo.On("FindByID", taskID).Return(existingTask, nil).Times(2)
	mockTaskRepo.On("UpdateStatus", taskID, newStatus).Return(nil)

	task, err := service.UpdateStatus(taskID, userID, newStatus)

	assert.NoError(t, err)
	assert.NotNil(t, task)
	mockTaskRepo.AssertExpectations(t)
}
