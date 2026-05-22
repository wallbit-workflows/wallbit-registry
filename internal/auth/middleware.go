package auth

import (
	"errors"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/wallbit-workflows/wallbit-registry/internal/response"
	"github.com/wallbit-workflows/wallbit-registry/internal/store"
)

type Middleware struct {
	queries *store.Queries
}

func NewMiddleware(queries *store.Queries) *Middleware {
	return &Middleware{queries: queries}
}

func (m *Middleware) RequireUser(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := m.resolveUserID(r)
		if err != nil {
			response.WriteError(w, http.StatusUnauthorized, "unauthorized")
			return
		}
		next(w, r.WithContext(withUserID(r.Context(), userID)))
	}
}

func (m *Middleware) resolveUserID(r *http.Request) (pgtype.UUID, error) {
	token, err := bearerToken(r)
	if err != nil {
		return pgtype.UUID{}, err
	}

	row, err := m.queries.GetAPIKeyByHash(r.Context(), HashKey(token))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return pgtype.UUID{}, errors.New("invalid api key")
		}
		return pgtype.UUID{}, err
	}
	return row.UserID, nil
}

func bearerToken(r *http.Request) (string, error) {
	header := r.Header.Get("Authorization")
	if header == "" {
		return "", errors.New("missing authorization")
	}
	const prefix = "Bearer "
	if !strings.HasPrefix(header, prefix) {
		return "", errors.New("invalid authorization scheme")
	}
	token := strings.TrimSpace(strings.TrimPrefix(header, prefix))
	if token == "" {
		return "", errors.New("empty bearer token")
	}
	return token, nil
}
