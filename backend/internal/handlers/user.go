package handlers

import (
	"net/http"

	"github.com/IgnacioIbaigorria/taskflow/backend/internal/services"
	"github.com/gin-gonic/gin"
)

// UserHandler handles user endpoints
type UserHandler struct {
	userService *services.UserService
}

// NewUserHandler creates a new user handler
func NewUserHandler(userService *services.UserService) *UserHandler {
	return &UserHandler{
		userService: userService,
	}
}

// List lists users
// @Summary List users
// @Description Get a list of potential assignees
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} []map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Router /api/v1/users [get]
func (h *UserHandler) List(c *gin.Context) {
	users, err := h.userService.List()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Filter sensitive data
	var response []map[string]interface{}
	for _, u := range users {
		response = append(response, map[string]interface{}{
			"id":    u.ID,
			"name":  u.Name,
			"email": u.Email,
		})
	}

	c.JSON(http.StatusOK, response)
}
