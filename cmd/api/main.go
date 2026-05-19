package main

import (
	"log"
	"net/http"

	"github.com/wallbit-workflows/wallbit-registry/internal/config"
)

func main() {
	cfg := config.Load()
	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
	})

	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: mux,
	}

	if err := srv.ListenAndServe(); err != nil {
		log.Fatalf("Error running api")
	}
}
