package services

import (
	"github.com/taskflow/backend/internal/models"
	"github.com/taskflow/backend/internal/repository"
)

// UserService handles user business logic
type UserService struct {
	userRepo *repository.UserRepository
}

// NewUserService creates a new user service
func NewUserService(userRepo *repository.UserRepository) *UserService {
	return &UserService{
		userRepo: userRepo,
	}
}

// List lists all users
func (s *UserService) List() ([]models.User, error) {
	return s.userRepo.List()
}
