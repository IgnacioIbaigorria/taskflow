package services

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/taskflow/backend/internal/config"
	"github.com/taskflow/backend/internal/models"
	"github.com/google/uuid"
)

// MockUserRepository is a mock implementation of UserRepository
type MockUserRepository struct {
	mock.Mock
}

func (m *MockUserRepository) Create(user *models.User) error {
	args := m.Called(user)
	return args.Error(0)
}

func (m *MockUserRepository) FindByEmail(email string) (*models.User, error) {
	args := m.Called(email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockUserRepository) FindByID(id uuid.UUID) (*models.User, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockUserRepository) EmailExists(email string) (bool, error) {
	args := m.Called(email)
	return args.Bool(0), args.Error(1)
}

func TestRegister_Success(t *testing.T) {
	mockRepo := new(MockUserRepository)
	cfg := &config.Config{
		JWT: config.JWTConfig{
			Secret:                "test-secret",
			ExpirationHours:       24,
			RefreshExpirationHours: 168,
		},
	}
	service := NewAuthService(mockRepo, cfg)

	req := RegisterRequest{
		Email:    "test@example.com",
		Password: "password123",
		Name:     "Test User",
	}

	mockRepo.On("EmailExists", req.Email).Return(false, nil)
	mockRepo.On("Create", mock.AnythingOfType("*models.User")).Return(nil)

	response, err := service.Register(req)

	assert.NoError(t, err)
	assert.NotNil(t, response)
	assert.Equal(t, req.Email, response.User.Email)
	assert.NotEmpty(t, response.Token)
	assert.NotEmpty(t, response.RefreshToken)
	mockRepo.AssertExpectations(t)
}

func TestRegister_EmailExists(t *testing.T) {
	mockRepo := new(MockUserRepository)
	cfg := &config.Config{
		JWT: config.JWTConfig{
			Secret: "test-secret",
		},
	}
	service := NewAuthService(mockRepo, cfg)

	req := RegisterRequest{
		Email:    "existing@example.com",
		Password: "password123",
		Name:     "Test User",
	}

	mockRepo.On("EmailExists", req.Email).Return(true, nil)

	response, err := service.Register(req)

	assert.Error(t, err)
	assert.Nil(t, response)
	assert.Equal(t, "email already registered", err.Error())
	mockRepo.AssertExpectations(t)
}

func TestLogin_Success(t *testing.T) {
	mockRepo := new(MockUserRepository)
	cfg := &config.Config{
		JWT: config.JWTConfig{
			Secret:                "test-secret",
			ExpirationHours:       24,
			RefreshExpirationHours: 168,
		},
	}
	service := NewAuthService(mockRepo, cfg)

	user := &models.User{
		ID:    uuid.New(),
		Email: "test@example.com",
		Name:  "Test User",
	}
	user.Password = "password123"
	user.HashPassword()

	req := LoginRequest{
		Email:    "test@example.com",
		Password: "password123",
	}

	mockRepo.On("FindByEmail", req.Email).Return(user, nil)

	response, err := service.Login(req)

	assert.NoError(t, err)
	assert.NotNil(t, response)
	assert.Equal(t, user.Email, response.User.Email)
	assert.NotEmpty(t, response.Token)
	mockRepo.AssertExpectations(t)
}

func TestLogin_InvalidPassword(t *testing.T) {
	mockRepo := new(MockUserRepository)
	cfg := &config.Config{
		JWT: config.JWTConfig{
			Secret: "test-secret",
		},
	}
	service := NewAuthService(mockRepo, cfg)

	user := &models.User{
		ID:    uuid.New(),
		Email: "test@example.com",
		Name:  "Test User",
	}
	user.Password = "correctpassword"
	user.HashPassword()

	req := LoginRequest{
		Email:    "test@example.com",
		Password: "wrongpassword",
	}

	mockRepo.On("FindByEmail", req.Email).Return(user, nil)

	response, err := service.Login(req)

	assert.Error(t, err)
	assert.Nil(t, response)
	assert.Equal(t, "invalid email or password", err.Error())
	mockRepo.AssertExpectations(t)
}
