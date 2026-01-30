package services

import (
	"github.com/IgnacioIbaigorria/taskflow/backend/internal/models"
)

// UserService handles user business logic
type UserService struct {
	userRepo UserRepository
}

// NewUserService creates a new user service
func NewUserService(userRepo UserRepository) *UserService {
	return &UserService{
		userRepo: userRepo,
	}
}

// List lists all users
func (s *UserService) List() ([]models.User, error) {
	return s.userRepo.List()
}
