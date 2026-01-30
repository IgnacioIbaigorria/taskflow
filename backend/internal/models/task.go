package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// TaskStatus represents the status of a task
type TaskStatus string

const (
	TaskStatusPending    TaskStatus = "pending"
	TaskStatusInProgress TaskStatus = "in_progress"
	TaskStatusCompleted  TaskStatus = "completed"
	TaskStatusCancelled  TaskStatus = "cancelled"
)

// Priority represents the priority level of a task
type Priority string

const (
	PriorityLow    Priority = "low"
	PriorityMedium Priority = "medium"
	PriorityHigh   Priority = "high"
	PriorityUrgent Priority = "urgent"
)

// Task represents a task in the system
type Task struct {
	ID          uuid.UUID  `json:"id" gorm:"type:uuid;primary_key"`
	Title       string     `json:"title" gorm:"type:varchar(100);not null"`
	Description string     `json:"description" gorm:"type:varchar(500)"`
	Status      TaskStatus `json:"status" gorm:"type:varchar(20);not null;default:'pending'"`
	Priority    Priority   `json:"priority" gorm:"type:varchar(20);not null;default:'medium'"`
	DueDate     *time.Time `json:"due_date" gorm:"type:timestamp"`
	CreatedBy   uuid.UUID  `json:"created_by" gorm:"type:uuid;not null"`
	AssignedTo  *uuid.UUID `json:"assigned_to" gorm:"type:uuid"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	Creator     *User      `json:"creator,omitempty" gorm:"foreignKey:CreatedBy"`
	Assignee    *User      `json:"assignee,omitempty" gorm:"foreignKey:AssignedTo"`
}

// BeforeCreate hook generates UUID before creating task
func (t *Task) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}

// IsValidStatus checks if the status is valid
func (s TaskStatus) IsValid() bool {
	switch s {
	case TaskStatusPending, TaskStatusInProgress, TaskStatusCompleted, TaskStatusCancelled:
		return true
	}
	return false
}

// IsValidPriority checks if the priority is valid
func (p Priority) IsValid() bool {
	switch p {
	case PriorityLow, PriorityMedium, PriorityHigh, PriorityUrgent:
		return true
	}
	return false
}

// TaskFilter represents filters for querying tasks
type TaskFilter struct {
	Status      *TaskStatus
	Priority    *Priority
	CreatedBy   *uuid.UUID
	AssignedTo  *uuid.UUID
	RelatedUser *uuid.UUID
	Page        int
	PageSize    int
	SortBy      string // due_date, priority, created_at
	SortOrder   string // asc, desc
}

// TaskEvent represents a task event for WebSocket notifications
type TaskEvent struct {
	Type   string    `json:"type"` // created, updated, deleted, assigned
	TaskID uuid.UUID `json:"task_id"`
	Task   *Task     `json:"task,omitempty"`
	UserID uuid.UUID `json:"user_id"` // User who triggered the event
}
