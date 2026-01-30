package middleware

import (
	"strings"

	"github.com/IgnacioIbaigorria/taskflow/backend/internal/config"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// CORSMiddleware configures CORS
func CORSMiddleware(cfg *config.Config) gin.HandlerFunc {
	origins := strings.Split(cfg.CORS.AllowedOrigins, ",")

	corsConfig := cors.Config{
		AllowOrigins:     origins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}

	return cors.New(corsConfig)
}
