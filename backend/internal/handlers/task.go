package handlers

import (
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/taskflow/backend/internal/middleware"
	"github.com/taskflow/backend/internal/models"
	"github.com/taskflow/backend/internal/services"
	ws "github.com/taskflow/backend/internal/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for development
	},
}

// TaskHandler handles task endpoints
type TaskHandler struct {
	taskService *services.TaskService
	hub         *ws.Hub
}

// NewTaskHandler creates a new task handler
func NewTaskHandler(taskService *services.TaskService, hub *ws.Hub) *TaskHandler {
	return &TaskHandler{
		taskService: taskService,
		hub:         hub,
	}
}

// Create creates a new task
// @Summary Create a task
// @Description Create a new task
// @Tags tasks
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body services.CreateTaskRequest true "Create task request"
// @Success 201 {object} models.Task
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Router /api/v1/tasks [post]
func (h *TaskHandler) Create(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req services.CreateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	task, err := h.taskService.Create(userID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Broadcast task created event
	h.hub.BroadcastTaskEvent(models.TaskEvent{
		Type:   "created",
		TaskID: task.ID,
		Task:   task,
		UserID: userID,
	})

	c.JSON(http.StatusCreated, task)
}

// List lists tasks with filters and pagination
// @Summary List tasks
// @Description Get a paginated list of tasks with optional filters
// @Tags tasks
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param status query string false "Filter by status"
// @Param priority query string false "Filter by priority"
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(20)
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Router /api/v1/tasks [get]
func (h *TaskHandler) List(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	filter := models.TaskFilter{
		Page:     1,
		PageSize: 20,
	}

	// Parse query parameters
	if status := c.Query("status"); status != "" {
		taskStatus := models.TaskStatus(status)
		filter.Status = &taskStatus
	}
	if priority := c.Query("priority"); priority != "" {
		taskPriority := models.Priority(priority)
		filter.Priority = &taskPriority
	}
	if page := c.Query("page"); page != "" {
		if p, err := strconv.Atoi(page); err == nil {
			filter.Page = p
		}
	}
	if pageSize := c.Query("page_size"); pageSize != "" {
		if ps, err := strconv.Atoi(pageSize); err == nil {
			filter.PageSize = ps
		}
	}

	tasks, total, err := h.taskService.List(userID, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"tasks":     tasks,
		"total":     total,
		"page":      filter.Page,
		"page_size": filter.PageSize,
	})
}

// GetByID gets a task by ID
// @Summary Get task by ID
// @Description Get detailed information about a specific task
// @Tags tasks
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Task ID"
// @Success 200 {object} models.Task
// @Failure 404 {object} map[string]interface{}
// @Router /api/v1/tasks/{id} [get]
func (h *TaskHandler) GetByID(c *gin.Context) {
	taskID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	task, err := h.taskService.GetByID(taskID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, task)
}

// Update updates a task
// @Summary Update task
// @Description Update an existing task
// @Tags tasks
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Task ID"
// @Param request body services.UpdateTaskRequest true "Update task request"
// @Success 200 {object} models.Task
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Router /api/v1/tasks/{id} [put]
func (h *TaskHandler) Update(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	taskID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	var req services.UpdateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	task, err := h.taskService.Update(taskID, userID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Broadcast task updated event
	h.hub.BroadcastTaskEvent(models.TaskEvent{
		Type:   "updated",
		TaskID: task.ID,
		Task:   task,
		UserID: userID,
	})

	c.JSON(http.StatusOK, task)
}

// Delete deletes a task
// @Summary Delete task
// @Description Delete a task
// @Tags tasks
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Task ID"
// @Success 204
// @Failure 401 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /api/v1/tasks/{id} [delete]
func (h *TaskHandler) Delete(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	taskID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	err = h.taskService.Delete(taskID, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Broadcast task deleted event
	h.hub.BroadcastTaskEvent(models.TaskEvent{
		Type:   "deleted",
		TaskID: taskID,
		UserID: userID,
	})

	c.Status(http.StatusNoContent)
}

// UpdateStatus updates a task status
// @Summary Update task status
// @Description Change the status of a task
// @Tags tasks
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Task ID"
// @Param request body map[string]string true "Status update"
// @Success 200 {object} models.Task
// @Failure 400 {object} map[string]interface{}
// @Router /api/v1/tasks/{id}/status [patch]
func (h *TaskHandler) UpdateStatus(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	taskID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	var req struct {
		Status models.TaskStatus `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	task, err := h.taskService.UpdateStatus(taskID, userID, req.Status)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Broadcast status update event
	h.hub.BroadcastTaskEvent(models.TaskEvent{
		Type:   "updated",
		TaskID: task.ID,
		Task:   task,
		UserID: userID,
	})

	c.JSON(http.StatusOK, task)
}

// AssignTask assigns a task to a user
// @Summary Assign task
// @Description Assign a task to a specific user
// @Tags tasks
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Task ID"
// @Param request body map[string]string true "Assign request"
// @Success 200 {object} models.Task
// @Failure 400 {object} map[string]interface{}
// @Router /api/v1/tasks/{id}/assign [post]
func (h *TaskHandler) AssignTask(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	taskID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	var req struct {
		AssignTo string `json:"assign_to" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	assignToID, err := uuid.Parse(req.AssignTo)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	task, err := h.taskService.AssignTask(taskID, assignToID, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Broadcast assignment event
	h.hub.BroadcastTaskEvent(models.TaskEvent{
		Type:   "assigned",
		TaskID: task.ID,
		Task:   task,
		UserID: userID,
	})

	c.JSON(http.StatusOK, task)
}

// WebSocket handles WebSocket connections
// @Summary WebSocket connection
// @Description Establish WebSocket connection for real-time updates
// @Tags websocket
// @Security BearerAuth
// @Router /ws [get]
func (h *TaskHandler) WebSocket(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to upgrade connection: %v", err)
		return
	}

	client := &ws.Client{
		ID:     uuid.New(),
		UserID: userID,
		Conn:   conn,
		Send:   make(chan []byte, 256),
		Hub:    h.hub,
	}

	h.hub.Register <- client

	// Start read and write pumps
	go client.WritePump()
	go client.ReadPump()
}
