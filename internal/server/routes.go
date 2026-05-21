package server

import (
	"net/http"

	"github.com/wallbit-workflows/wallbit-registry/internal/health"
	"github.com/wallbit-workflows/wallbit-registry/internal/workflows"
)

func addRoutes(
	mux *http.ServeMux,
	healthHandler *health.Handler,
	workflowsHandler *workflows.Handler,
) {
	healthHandler.RegisterRoutes(mux)
	workflowsHandler.RegisterRoutes(mux)
}
