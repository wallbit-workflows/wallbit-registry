package auth

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

type contextKey struct{}

var userIDKey = contextKey{}

func withUserID(ctx context.Context, userID pgtype.UUID) context.Context {
	return context.WithValue(ctx, userIDKey, userID)
}

func UserID(ctx context.Context) (pgtype.UUID, bool) {
	id, ok := ctx.Value(userIDKey).(pgtype.UUID)
	return id, ok && id.Valid
}
