package tests

import (
	"testing"

	"github.com/IgnacioIbaigorria/taskflow/backend/internal/config"
	"github.com/IgnacioIbaigorria/taskflow/backend/internal/services"
	"github.com/stretchr/testify/assert"
)

func TestRegister_WeakPassword_ShouldFail(t *testing.T) {
	mockRepo := new(MockUserRepository)
	cfg := &config.Config{
		JWT: config.JWTConfig{
			Secret: "test-secret",
		},
	}
	service := services.NewAuthService(mockRepo, cfg)

	req := services.RegisterRequest{
		Email:    "test@example.com",
		Password: "123", // Weak password
		Name:     "Test User",
	}

	mockRepo.On("EmailExists", req.Email).Return(false, nil)

	_, err := service.Register(req)

	assert.Error(t, err)
	assert.Equal(t, "password must be at least 6 characters", err.Error())
	mockRepo.AssertNotCalled(t, "Create")
}

func TestRegister_EmptyEmail_ShouldFail(t *testing.T) {
	mockRepo := new(MockUserRepository)
	cfg := &config.Config{
		JWT: config.JWTConfig{
			Secret: "test-secret",
		},
	}
	service := services.NewAuthService(mockRepo, cfg)

	req := services.RegisterRequest{
		Email:    "",
		Password: "password123",
		Name:     "Test User",
	}

	mockRepo.On("EmailExists", "").Return(false, nil)

	_, err := service.Register(req)

	assert.Error(t, err)
	assert.Equal(t, "email is required", err.Error())
	mockRepo.AssertNotCalled(t, "Create")
}
