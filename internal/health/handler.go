package health

import (
	"net/http"

	"github.com/wallbit-workflows/wallbit-registry/internal/response"
)

type Handler struct{}

func NewHandler() *Handler {
	return &Handler{}
}

type healthResponse struct {
	Status string `json:"status"`
}

func (*Handler) Health(w http.ResponseWriter, r *http.Request) {
	response.WriteJSON(w, http.StatusOK, healthResponse{Status: "OK"})
}

func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /health", h.Health)
}
