package config

import (
	"log/slog"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port string
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		slog.Default().Warn("loading .env failed", "error", err)
	}

	return &Config{
		Port: getEnv("PORT", "8080"),
	}
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
