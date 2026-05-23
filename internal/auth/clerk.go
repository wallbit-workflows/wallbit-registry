package auth

import (
	"context"
	"errors"
	"fmt"

	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/clerk/clerk-sdk-go/v2/jwt"
	"github.com/jackc/pgx/v5/pgtype"
)

func (m *Middleware) userIDFromClerkJWT(ctx context.Context, token string) (pgtype.UUID, error) {
	if m.clerkSecretKey == "" {
		return pgtype.UUID{}, errors.New("clerk is not configured")
	}

	clerk.SetKey(m.clerkSecretKey)

	claims, err := jwt.Verify(ctx, &jwt.VerifyParams{Token: token})
	if err != nil {
		return pgtype.UUID{}, fmt.Errorf("verify clerk jwt: %w", err)
	}

	clerkUserID := claims.Subject
	if clerkUserID == "" {
		return pgtype.UUID{}, errors.New("clerk jwt missing subject")
	}

	clerkID := clerkUserID
	user, err := m.queries.GetOrCreateUserByClerkID(ctx, &clerkID)
	if err != nil {
		return pgtype.UUID{}, fmt.Errorf("get or create clerk user: %w", err)
	}

	return user.ID, nil
}
