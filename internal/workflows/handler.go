package workflows

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/wallbit-workflows/wallbit-registry/internal/response"
)

const (
	defaultListLimit = 20
	maxListLimit     = 50
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	username := r.PathValue("username")
	slug := r.PathValue("slug")

	meta, err := h.svc.Get(r.Context(), username, slug)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			response.WriteError(w, http.StatusNotFound, "workflow not found")
			return
		}
		response.WriteError(w, http.StatusInternalServerError, "failed to get workflow")
		return
	}

	response.WriteJSON(w, http.StatusOK, meta)
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

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	limit, err := queryInt(r, "limit", defaultListLimit)
	if err != nil {
		response.WriteError(w, http.StatusBadRequest, "invalid limit")
		return
	}
	if limit > maxListLimit {
		limit = maxListLimit
	}
	if limit < 1 {
		limit = defaultListLimit
	}

	offset, err := queryInt(r, "offset", 0)
	if err != nil {
		response.WriteError(w, http.StatusBadRequest, "invalid offset")
		return
	}
	if offset < 0 {
		offset = 0
	}

	items, err := h.svc.List(r.Context(), limit, offset)
	if err != nil {
		response.WriteError(w, http.StatusInternalServerError, "failed to list workflows")
		return
	}

	response.WriteJSON(w, http.StatusOK, ListResponse{
		Items:  items,
		Limit:  limit,
		Offset: offset,
	})
}

func queryInt(r *http.Request, key string, fallback int) (int, error) {
	raw := r.URL.Query().Get(key)
	if raw == "" {
		return fallback, nil
	}
	n, err := strconv.Atoi(raw)
	if err != nil {
		return 0, err
	}
	return n, nil
}

func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /workflows", h.List)
	mux.HandleFunc("GET /workflows/{username}/{slug}", h.Get)
	mux.HandleFunc("GET /workflows/{username}/{slug}/download", h.Download)
}
