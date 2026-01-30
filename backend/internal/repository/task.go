package repository

import (
	"errors"
	"strings"

	"github.com/IgnacioIbaigorria/taskflow/backend/internal/models"
	"github.com/google/uuid"
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
	if filter.RelatedUser != nil {
		query = query.Where("created_by = ? OR assigned_to = ?", *filter.RelatedUser, *filter.RelatedUser)
	}

	// Count total
	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	// Recreate query for actual data fetch to avoid GORM query reuse issues
	query = r.db.Model(&models.Task{})

	// Reapply filters
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
	if filter.RelatedUser != nil {
		query = query.Where("created_by = ? OR assigned_to = ?", *filter.RelatedUser, *filter.RelatedUser)
	}

	// Apply pagination and ordering
	offset := (filter.Page - 1) * filter.PageSize

	query = query.Debug().
		Preload("Creator").
		Preload("Assignee")

	// Dynamic Ordering
	if filter.SortBy != "" {
		sortKeys := strings.Split(filter.SortBy, ",")
		sortOrders := strings.Split(filter.SortOrder, ",")

		for i, key := range sortKeys {
			direction := "ASC"
			if i < len(sortOrders) && sortOrders[i] == "desc" {
				direction = "DESC"
			} else if i >= len(sortOrders) && len(sortOrders) > 0 && sortOrders[0] == "desc" {
				// If fewer orders than keys, inherit the first one? Or default ASC.
				// Let's default to ASC if missing, but check if user provided single global order.
				// Actually safer to default ASC unless specified.
				direction = "ASC"
			}

			// Allow explicit single order for all keys if only one provided?
			// Simple logic: index matching.

			key = strings.TrimSpace(key)
			switch key {
			case "due_date":
				query = query.Order("due_date " + direction + " NULLS LAST")
			case "created_at":
				query = query.Order("created_at " + direction)
			case "priority":
				if direction == "ASC" {
					query = query.Order("CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END")
				} else {
					query = query.Order("CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END DESC")
				}
			}
		}
		// Secondary sort always useful
		query = query.Order("created_at DESC")
	} else {

		// Default Sort: DueDate(Day) -> Priority -> CreatedAt
		query = query.
			Order("DATE(due_date) ASC NULLS LAST").
			Order("CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END").
			Order("created_at DESC")
	}

	err = query.
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
