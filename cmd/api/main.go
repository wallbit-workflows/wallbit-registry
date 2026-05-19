package main

import (
	"context"
	"log"
	"net/http"

	"github.com/wallbit-workflows/wallbit-registry/internal/config"
	"github.com/wallbit-workflows/wallbit-registry/internal/db"
	"github.com/wallbit-workflows/wallbit-registry/internal/health"
	"github.com/wallbit-workflows/wallbit-registry/internal/server"
)

func main() {
	cfg := config.Load()
	if cfg.DatabaseURL == "" {
		log.Fatal("DATABASE_URL is required")
	}

	ctx := context.Background()

	pool, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer db.Close(pool)

	healthSvc := health.New(pool)
	handler := server.New(healthSvc)

	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: handler,
	}

	log.Printf("listening on %s", srv.Addr)
	if err := srv.ListenAndServe(); err != nil {
		log.Fatalf("server: %v", err)
	}
}
