package workflows

import (
	"errors"
	"net/http"

	"github.com/wallbit-workflows/wallbit-registry/internal/response"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) Download(w http.ResponseWriter, r *http.Request) {
	username := r.PathValue("username")
	slug := r.PathValue("slug")

	content, err := h.svc.Download(r.Context(), username, slug)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			response.WriteError(w, http.StatusNotFound, "workflow not found")
			return
		}
		response.WriteError(w, http.StatusInternalServerError, "failed to download workflow")
		return
	}

	response.WriteYAML(w, http.StatusOK, []byte(content))
}

func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /workflows/{username}/{slug}/download", h.Download)
}
