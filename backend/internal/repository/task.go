package repository

import (
	"errors"

	"github.com/google/uuid"
	"github.com/taskflow/backend/internal/models"
	"gorm.io/gorm"
)

// TaskRepository handles database operations for tasks
type TaskRepository struct {
	db *gorm.DB
}

// NewTaskRepository creates a new task repository
func NewTaskRepository(db *gorm.DB) *TaskRepository {
	return &TaskRepository{db: db}
}

// Create creates a new task
func (r *TaskRepository) Create(task *models.Task) error {
	return r.db.Create(task).Error
}

// FindByID finds a task by ID
func (r *TaskRepository) FindByID(id uuid.UUID) (*models.Task, error) {
	var task models.Task
	err := r.db.Preload("Creator").Preload("Assignee").Where("id = ?", id).First(&task).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &task, nil
}

// Update updates a task
func (r *TaskRepository) Update(task *models.Task) error {
	return r.db.Save(task).Error
}

// Delete deletes a task
func (r *TaskRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Task{}, id).Error
}

// List lists tasks with filters and pagination
func (r *TaskRepository) List(filter models.TaskFilter) ([]models.Task, int64, error) {
	var tasks []models.Task
	var total int64

	query := r.db.Model(&models.Task{})

	// Apply filters
	if filter.Status != nil {
		query = query.Where("status = ?", *filter.Status)
	}
	if filter.Priority != nil {
		query = query.Where("priority = ?", *filter.Priority)
	}
	if filter.CreatedBy != nil {
		query = query.Where("created_by = ?", *filter.CreatedBy)
	}
	if filter.AssignedTo != nil {
		query = query.Where("assigned_to = ?", *filter.AssignedTo)
	}

	// Count total
	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	// Apply pagination
	offset := (filter.Page - 1) * filter.PageSize
	err = query.
		Preload("Creator").
		Preload("Assignee").
		Order("created_at DESC").
		Limit(filter.PageSize).
		Offset(offset).
		Find(&tasks).Error

	if err != nil {
		return nil, 0, err
	}

	return tasks, total, nil
}

// UpdateStatus updates only the status of a task
func (r *TaskRepository) UpdateStatus(id uuid.UUID, status models.TaskStatus) error {
	return r.db.Model(&models.Task{}).Where("id = ?", id).Update("status", status).Error
}

// AssignTask assigns a task to a user
func (r *TaskRepository) AssignTask(taskID, userID uuid.UUID) error {
	return r.db.Model(&models.Task{}).Where("id = ?", taskID).Update("assigned_to", userID).Error
}
