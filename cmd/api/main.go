package main

import (
	"log"
	"net/http"

	"github.com/wallbit-workflows/wallbit-registry/internal/config"
	"github.com/wallbit-workflows/wallbit-registry/internal/health"
	"github.com/wallbit-workflows/wallbit-registry/internal/server"
)

func main() {
	cfg := config.Load()

	healthSvc := health.NewHandler()
	handler := server.New(healthSvc)

	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: handler,
	}

	if err := srv.ListenAndServe(); err != nil {
		log.Fatalf("Error running api: %v", err)
	}
}
