package main

import (
	"log"

	"github.com/IgnacioIbaigorria/taskflow/backend/internal/config"
	"github.com/IgnacioIbaigorria/taskflow/backend/internal/database"
	"github.com/IgnacioIbaigorria/taskflow/backend/internal/handlers"
	"github.com/IgnacioIbaigorria/taskflow/backend/internal/middleware"
	"github.com/IgnacioIbaigorria/taskflow/backend/internal/repository"
	"github.com/IgnacioIbaigorria/taskflow/backend/internal/services"
	"github.com/IgnacioIbaigorria/taskflow/backend/internal/websocket"
	"github.com/gin-gonic/gin"

	_ "github.com/IgnacioIbaigorria/taskflow/backend/docs" // Import generated docs
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// @title TaskFlow API
// @version 1.0
// @description API for TaskFlow - Collaborative Task Management Application
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.email support@taskflow.com

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:8080
// @BasePath /

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Set Gin mode
	gin.SetMode(cfg.Server.Mode)

	// Connect to database
	if err := database.Connect(cfg); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Run migrations
	if err := database.Migrate(); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Initialize repositories
	userRepo := repository.NewUserRepository(database.DB)
	taskRepo := repository.NewTaskRepository(database.DB)

	// Initialize services
	authService := services.NewAuthService(userRepo, cfg)
	taskService := services.NewTaskService(taskRepo, userRepo)
	userService := services.NewUserService(userRepo)

	// Initialize WebSocket hub
	hub := websocket.NewHub()
	go hub.Run()

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)
	taskHandler := handlers.NewTaskHandler(taskService, hub)
	userHandler := handlers.NewUserHandler(userService)

	// Setup router
	router := gin.Default()

	// Middleware
	router.Use(middleware.CORSMiddleware(cfg))

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Swagger documentation
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// API routes
	v1 := router.Group("/api/v1")
	{
		// Auth routes (public)
		auth := v1.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.RefreshToken)
		}

		// Protected routes
		protected := v1.Group("")
		protected.Use(middleware.AuthMiddleware(cfg))
		{
			// Task routes
			tasks := protected.Group("/tasks")
			{
				tasks.GET("", taskHandler.List)
				tasks.POST("", taskHandler.Create)
				tasks.GET("/:id", taskHandler.GetByID)
				tasks.PUT("/:id", taskHandler.Update)
				tasks.DELETE("/:id", taskHandler.Delete)
				tasks.PATCH("/:id/status", taskHandler.UpdateStatus)
				tasks.POST("/:id/assign", taskHandler.AssignTask)
			}

			// User routes
			users := protected.Group("/users")
			{
				users.GET("", userHandler.List)
			}
		}

		// WebSocket endpoint (protected)
		v1.GET("/ws", middleware.AuthMiddleware(cfg), taskHandler.WebSocket)
	}

	// Start server
	addr := ":" + cfg.Server.Port
	log.Printf("Server starting on %s", addr)
	log.Printf("Swagger documentation available at http://localhost%s/swagger/index.html", addr)

	if err := router.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
