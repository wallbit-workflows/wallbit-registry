package server

import (
	"net/http"

	"github.com/wallbit-workflows/wallbit-registry/internal/health"
)

func New(healthHandler *health.Handler) http.Handler {
	mux := http.NewServeMux()
	healthHandler.RegisterRoutes(mux)
	return mux
}
