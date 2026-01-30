package services

import (
	"errors"
	"time"

	"github.com/IgnacioIbaigorria/taskflow/backend/internal/models"
	"github.com/google/uuid"
)

// TaskRepository interface for task service
type TaskRepository interface {
	Create(task *models.Task) error
	FindByID(id uuid.UUID) (*models.Task, error)
	Update(task *models.Task) error
	Delete(id uuid.UUID) error
	List(filter models.TaskFilter) ([]models.Task, int64, error)
	UpdateStatus(id uuid.UUID, status models.TaskStatus) error
	AssignTask(taskID, userID uuid.UUID) error
}

// TaskService handles task business logic
type TaskService struct {
	taskRepo TaskRepository
	userRepo UserRepository
}

// NewTaskService creates a new task service
func NewTaskService(taskRepo TaskRepository, userRepo UserRepository) *TaskService {
	return &TaskService{
		taskRepo: taskRepo,
		userRepo: userRepo,
	}
}

// CreateTaskRequest represents a create task request
type CreateTaskRequest struct {
	Title       string          `json:"title" binding:"required,max=100"`
	Description string          `json:"description" binding:"max=500"`
	Priority    models.Priority `json:"priority" binding:"required"`
	DueDate     *string         `json:"due_date"`
}

// UpdateTaskRequest represents an update task request
type UpdateTaskRequest struct {
	Title       *string            `json:"title" binding:"omitempty,max=100"`
	Description *string            `json:"description" binding:"omitempty,max=500"`
	Priority    *models.Priority   `json:"priority"`
	Status      *models.TaskStatus `json:"status"`
	DueDate     *string            `json:"due_date"`
}

// Create creates a new task
func (s *TaskService) Create(userID uuid.UUID, req CreateTaskRequest) (*models.Task, error) {
	// Validate priority
	if !req.Priority.IsValid() {
		return nil, errors.New("invalid priority")
	}

	var dueDate *time.Time
	if req.DueDate != nil {
		parsed, err := time.Parse(time.RFC3339, *req.DueDate)
		if err != nil {
			return nil, errors.New("invalid due date format")
		}
		dueDate = &parsed
	}

	task := &models.Task{
		Title:       req.Title,
		Description: req.Description,
		Priority:    req.Priority,
		Status:      models.TaskStatusPending,
		DueDate:     dueDate,
		CreatedBy:   userID,
	}

	if err := s.taskRepo.Create(task); err != nil {
		return nil, err
	}

	// Reload to get relationships
	return s.taskRepo.FindByID(task.ID)
}

// GetByID gets a task by ID
func (s *TaskService) GetByID(id uuid.UUID) (*models.Task, error) {
	task, err := s.taskRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if task == nil {
		return nil, errors.New("task not found")
	}
	return task, nil
}

// Update updates a task
func (s *TaskService) Update(id uuid.UUID, userID uuid.UUID, req UpdateTaskRequest) (*models.Task, error) {
	task, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	// Check ownership
	if task.CreatedBy != userID {
		return nil, errors.New("unauthorized to update this task")
	}

	// Update fields
	if req.Title != nil {
		task.Title = *req.Title
	}
	if req.Description != nil {
		task.Description = *req.Description
	}
	if req.Priority != nil {
		if !req.Priority.IsValid() {
			return nil, errors.New("invalid priority")
		}
		task.Priority = *req.Priority
	}
	if req.Status != nil {
		if !req.Status.IsValid() {
			return nil, errors.New("invalid status")
		}
		task.Status = *req.Status
	}
	if req.DueDate != nil {
		parsed, err := time.Parse(time.RFC3339, *req.DueDate)
		if err != nil {
			return nil, errors.New("invalid due date format")
		}
		task.DueDate = &parsed
	}

	if err := s.taskRepo.Update(task); err != nil {
		return nil, err
	}

	return s.taskRepo.FindByID(id)
}

// Delete deletes a task
func (s *TaskService) Delete(id uuid.UUID, userID uuid.UUID) error {
	task, err := s.GetByID(id)
	if err != nil {
		return err
	}

	// Check ownership
	if task.CreatedBy != userID {
		return errors.New("unauthorized to delete this task")
	}

	return s.taskRepo.Delete(id)
}

// List lists tasks with filters
func (s *TaskService) List(userID uuid.UUID, filter models.TaskFilter) ([]models.Task, int64, error) {
	// Filter by user's tasks (created by or assigned to)
	// filter.RelatedUser = &userID

	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.PageSize < 1 || filter.PageSize > 100 {
		filter.PageSize = 20
	}

	return s.taskRepo.List(filter)
}

// UpdateStatus updates a task status
func (s *TaskService) UpdateStatus(id uuid.UUID, userID uuid.UUID, status models.TaskStatus) (*models.Task, error) {
	task, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	// Check if user has access (creator or assignee)
	if task.CreatedBy != userID && (task.AssignedTo == nil || *task.AssignedTo != userID) {
		return nil, errors.New("unauthorized to update this task")
	}

	if !status.IsValid() {
		return nil, errors.New("invalid status")
	}

	if err := s.taskRepo.UpdateStatus(id, status); err != nil {
		return nil, err
	}

	return s.taskRepo.FindByID(id)
}

// AssignTask assigns a task to a user
func (s *TaskService) AssignTask(taskID uuid.UUID, assignToUserID uuid.UUID, requestUserID uuid.UUID) (*models.Task, error) {
	task, err := s.GetByID(taskID)
	if err != nil {
		return nil, err
	}

	// Only creator can assign tasks
	if task.CreatedBy != requestUserID {
		return nil, errors.New("only task creator can assign tasks")
	}

	// Check if assignee exists
	assignee, err := s.userRepo.FindByID(assignToUserID)
	if err != nil {
		return nil, err
	}
	if assignee == nil {
		return nil, errors.New("assignee user not found")
	}

	if err := s.taskRepo.AssignTask(taskID, assignToUserID); err != nil {
		return nil, err
	}

	return s.taskRepo.FindByID(taskID)
}
