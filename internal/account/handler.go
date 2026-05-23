package account

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/wallbit-workflows/wallbit-registry/internal/auth"
	"github.com/wallbit-workflows/wallbit-registry/internal/response"
)

type Handler struct {
	svc            *Service
	authMiddleware *auth.Middleware
}

func NewHandler(svc *Service, authMiddleware *auth.Middleware) *Handler {
	return &Handler{svc: svc, authMiddleware: authMiddleware}
}

func (h *Handler) GetMe(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserID(r.Context())
	if !ok {
		response.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	me, err := h.svc.GetMe(r.Context(), userID)
	if err != nil {
		response.WriteError(w, http.StatusInternalServerError, "failed to get profile")
		return
	}

	response.WriteJSON(w, http.StatusOK, me)
}

func (h *Handler) UpdateMe(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserID(r.Context())
	if !ok {
		response.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req UpdateMeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.WriteError(w, http.StatusBadRequest, "invalid json body")
		return
	}
	defer r.Body.Close()

	me, err := h.svc.UpdateUsername(r.Context(), userID, req)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidInput):
			response.WriteError(w, http.StatusBadRequest, err.Error())
		case errors.Is(err, ErrUsernameTaken):
			response.WriteError(w, http.StatusConflict, "username already taken")
		default:
			response.WriteError(w, http.StatusInternalServerError, "failed to update profile")
		}
		return
	}

	response.WriteJSON(w, http.StatusOK, me)
}

func (h *Handler) CreateAPIKey(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserID(r.Context())
	if !ok {
		response.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req CreateAPIKeyRequest
	if r.Body != nil {
		defer r.Body.Close()
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			response.WriteError(w, http.StatusBadRequest, "invalid json body")
			return
		}
	}

	res, err := h.svc.CreateAPIKey(r.Context(), userID, req)
	if err != nil {
		response.WriteError(w, http.StatusInternalServerError, "failed to create api key")
		return
	}

	response.WriteJSON(w, http.StatusCreated, res)
}

func (h *Handler) ListAPIKeys(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserID(r.Context())
	if !ok {
		response.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	keys, err := h.svc.ListAPIKeys(r.Context(), userID)
	if err != nil {
		response.WriteError(w, http.StatusInternalServerError, "failed to list api keys")
		return
	}

	if keys == nil {
		keys = []APIKeyListItem{}
	}
	response.WriteJSON(w, http.StatusOK, keys)
}

func (h *Handler) RevokeAPIKey(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.UserID(r.Context())
	if !ok {
		response.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var keyID pgtype.UUID
	if err := keyID.Scan(r.PathValue("id")); err != nil || !keyID.Valid {
		response.WriteError(w, http.StatusBadRequest, "invalid api key id")
		return
	}

	err := h.svc.RevokeAPIKey(r.Context(), userID, keyID)
	if err != nil {
		if errors.Is(err, ErrAPIKeyNotFound) {
			response.WriteError(w, http.StatusNotFound, "api key not found")
			return
		}
		response.WriteError(w, http.StatusInternalServerError, "failed to revoke api key")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /me", h.authMiddleware.RequireUser(h.GetMe))
	mux.HandleFunc("PATCH /me", h.authMiddleware.RequireUser(h.UpdateMe))
	mux.HandleFunc("GET /api-keys", h.authMiddleware.RequireUser(h.ListAPIKeys))
	mux.HandleFunc("POST /api-keys", h.authMiddleware.RequireUser(h.CreateAPIKey))
	mux.HandleFunc("DELETE /api-keys/{id}", h.authMiddleware.RequireUser(h.RevokeAPIKey))
}
