package tests

import (
	"testing"
	"time"

	"github.com/IgnacioIbaigorria/taskflow/backend/internal/models"
	"github.com/IgnacioIbaigorria/taskflow/backend/internal/services"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestCreateTask_PastDueDate_ShouldFail(t *testing.T) {
	mockTaskRepo := new(MockTaskRepository)
	mockUserRepo := new(MockUserRepository)
	service := services.NewTaskService(mockTaskRepo, mockUserRepo)

	userID := uuid.New()
	pastDate := time.Now().Add(-24 * time.Hour).Format(time.RFC3339)

	req := services.CreateTaskRequest{
		Title:    "Past Task",
		Priority: models.PriorityMedium,
		DueDate:  &pastDate,
	}

	_, err := service.Create(userID, req)

	assert.Error(t, err)
	assert.Equal(t, "due date cannot be in the past", err.Error())
	mockTaskRepo.AssertNotCalled(t, "Create")
}

func TestUpdateTask_PastDueDate_ShouldFail(t *testing.T) {
	mockTaskRepo := new(MockTaskRepository)
	mockUserRepo := new(MockUserRepository)
	service := services.NewTaskService(mockTaskRepo, mockUserRepo)

	userID := uuid.New()
	taskID := uuid.New()
	pastDate := time.Now().Add(-24 * time.Hour).Format(time.RFC3339)

	existingTask := &models.Task{
		ID:        taskID,
		CreatedBy: userID,
		Status:    models.TaskStatusPending,
	}

	req := services.UpdateTaskRequest{
		DueDate: &pastDate,
	}

	mockTaskRepo.On("FindByID", taskID).Return(existingTask, nil)

	_, err := service.Update(taskID, userID, req)

	assert.Error(t, err)
	assert.Equal(t, "due date cannot be in the past", err.Error())
	mockTaskRepo.AssertNotCalled(t, "Update")
}

func TestCreateTask_InvalidPriority_ShouldFail(t *testing.T) {
	mockTaskRepo := new(MockTaskRepository)
	mockUserRepo := new(MockUserRepository)
	service := services.NewTaskService(mockTaskRepo, mockUserRepo)

	userID := uuid.New()
	req := services.CreateTaskRequest{
		Title:    "Invalid Priority Task",
		Priority: "critical", // Invalid priority
	}

	_, err := service.Create(userID, req)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid priority")
	mockTaskRepo.AssertNotCalled(t, "Create")
}
