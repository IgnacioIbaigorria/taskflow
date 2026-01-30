package services

import (
	"errors"
	"time"

	"github.com/IgnacioIbaigorria/taskflow/backend/internal/config"
	"github.com/IgnacioIbaigorria/taskflow/backend/internal/middleware"
	"github.com/IgnacioIbaigorria/taskflow/backend/internal/models"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// AuthService handles authentication business logic
// UserRepository interface for auth service
type UserRepository interface {
	Create(user *models.User) error
	FindByEmail(email string) (*models.User, error)
	FindByID(id uuid.UUID) (*models.User, error)
	EmailExists(email string) (bool, error)
	List() ([]models.User, error)
}

// AuthService handles authentication business logic
type AuthService struct {
	userRepo UserRepository
	config   *config.Config
}

// NewAuthService creates a new auth service
func NewAuthService(userRepo UserRepository, cfg *config.Config) *AuthService {
	return &AuthService{
		userRepo: userRepo,
		config:   cfg,
	}
}

// RegisterRequest represents a registration request
type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Name     string `json:"name" binding:"required,min=2"`
}

// LoginRequest represents a login request
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// AuthResponse represents an authentication response
type AuthResponse struct {
	User         models.UserResponse `json:"user"`
	Token        string              `json:"token"`
	RefreshToken string              `json:"refresh_token"`
}

// Register registers a new user
func (s *AuthService) Register(req RegisterRequest) (*AuthResponse, error) {
	// Check if email already exists
	exists, err := s.userRepo.EmailExists(req.Email)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, errors.New("email already registered")
	}

	// Create user
	user := &models.User{
		Email:    req.Email,
		Password: req.Password,
		Name:     req.Name,
	}

	// Hash password
	if err := user.HashPassword(); err != nil {
		return nil, err
	}

	// Save to database
	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	// Generate tokens
	token, err := s.generateToken(user.ID, user.Email, false)
	if err != nil {
		return nil, err
	}

	refreshToken, err := s.generateToken(user.ID, user.Email, true)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		User:         user.ToResponse(),
		Token:        token,
		RefreshToken: refreshToken,
	}, nil
}

// Login authenticates a user
func (s *AuthService) Login(req LoginRequest) (*AuthResponse, error) {
	// Find user by email
	user, err := s.userRepo.FindByEmail(req.Email)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("invalid email or password")
	}

	// Check password
	if !user.CheckPassword(req.Password) {
		return nil, errors.New("invalid email or password")
	}

	// Generate tokens
	token, err := s.generateToken(user.ID, user.Email, false)
	if err != nil {
		return nil, err
	}

	refreshToken, err := s.generateToken(user.ID, user.Email, true)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		User:         user.ToResponse(),
		Token:        token,
		RefreshToken: refreshToken,
	}, nil
}

// RefreshToken refreshes an access token
func (s *AuthService) RefreshToken(refreshToken string) (string, error) {
	claims := &middleware.Claims{}

	token, err := jwt.ParseWithClaims(refreshToken, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.config.JWT.Secret), nil
	})

	if err != nil || !token.Valid {
		return "", errors.New("invalid refresh token")
	}

	// Generate new access token
	newToken, err := s.generateToken(claims.UserID, claims.Email, false)
	if err != nil {
		return "", err
	}

	return newToken, nil
}

// generateToken generates a JWT token
func (s *AuthService) generateToken(userID uuid.UUID, email string, isRefresh bool) (string, error) {
	expirationHours := s.config.JWT.ExpirationHours
	if isRefresh {
		expirationHours = s.config.JWT.RefreshExpirationHours
	}

	claims := middleware.Claims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour * time.Duration(expirationHours))),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.config.JWT.Secret))
}
