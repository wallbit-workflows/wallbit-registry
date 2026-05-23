package auth

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/wallbit-workflows/wallbit-registry/internal/response"
	"github.com/wallbit-workflows/wallbit-registry/internal/store"
)

type Middleware struct {
	queries        *store.Queries
	clerkSecretKey string
}

func NewMiddleware(queries *store.Queries, clerkSecretKey string) *Middleware {
	return &Middleware{queries: queries, clerkSecretKey: clerkSecretKey}
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

	if strings.HasPrefix(token, registryKeyPrefix) {
		return m.userIDFromRegistryKey(r.Context(), token)
	}

	return m.userIDFromClerkJWT(r.Context(), token)
}

func (m *Middleware) userIDFromRegistryKey(ctx context.Context, token string) (pgtype.UUID, error) {
	row, err := m.queries.GetAPIKeyByHash(ctx, HashKey(token))
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
