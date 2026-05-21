package server

import (
	"net/http"

	"github.com/wallbit-workflows/wallbit-registry/internal/health"
	"github.com/wallbit-workflows/wallbit-registry/internal/workflows"
)

func New(healthHandler *health.Handler, workflowsHandler *workflows.Handler) http.Handler {
	mux := http.NewServeMux()
	addRoutes(mux, healthHandler, workflowsHandler)

	var handler http.Handler = mux

	return handler
}
