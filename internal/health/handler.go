package health

import (
	"context"
	"net/http"

	"github.com/wallbit-workflows/wallbit-registry/internal/response"
)

type Pinger interface {
	Ping(ctx context.Context) error
}

type Handler struct {
	db Pinger
}

func New(db Pinger) *Handler {
	return &Handler{db: db}
}

type healthResponse struct {
	Status string `json:"status"`
}

func (*Handler) Health(w http.ResponseWriter, r *http.Request) {
	response.WriteJSON(w, http.StatusOK, healthResponse{Status: "OK"})
}

func (h *Handler) Ready(w http.ResponseWriter, r *http.Request) {
	if h.db != nil {
		if err := h.db.Ping(r.Context()); err != nil {
			response.WriteJSON(w, http.StatusServiceUnavailable, healthResponse{Status: "unavailable"})
			return
		}
	}
	response.WriteJSON(w, http.StatusOK, healthResponse{Status: "OK"})
}

func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /health", h.Health)
	mux.HandleFunc("GET /ready", h.Ready)
}
