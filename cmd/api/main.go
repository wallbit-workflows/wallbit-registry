package main

import (
	"log"
	"net/http"

	"github.com/wallbit-workflows/wallbit-registry/internal/config"
	"github.com/wallbit-workflows/wallbit-registry/internal/response"
)

type healthResponse struct {
	Status string `json:"status"`
}

func main() {
	cfg := config.Load()
	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		response.WriteJSON(w, http.StatusOK, healthResponse{Status: "OK"})
	})

	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: mux,
	}

	if err := srv.ListenAndServe(); err != nil {
		log.Fatalf("Error running api")
	}
}
