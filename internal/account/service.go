package account

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/wallbit-workflows/wallbit-registry/internal/auth"
	"github.com/wallbit-workflows/wallbit-registry/internal/store"
)

type Service struct {
	queries *store.Queries
}

func NewService(queries *store.Queries) *Service {
	return &Service{queries: queries}
}

func (s *Service) GetMe(ctx context.Context, userID pgtype.UUID) (MeResponse, error) {
	user, err := s.queries.GetUserByID(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return MeResponse{}, fmt.Errorf("user not found: %w", err)
		}
		return MeResponse{}, fmt.Errorf("get user: %w", err)
	}

	return MeResponse{
		ID:       user.ID.String(),
		Username: user.Username,
	}, nil
}

func (s *Service) UpdateUsername(ctx context.Context, userID pgtype.UUID, req UpdateMeRequest) (MeResponse, error) {
	username, err := normalizeUsername(req.Username)
	if err != nil {
		return MeResponse{}, err
	}

	user, err := s.queries.UpdateUserUsername(ctx, store.UpdateUserUsernameParams{
		ID:       userID,
		Username: &username,
	})
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return MeResponse{}, ErrUsernameTaken
		}
		return MeResponse{}, fmt.Errorf("update username: %w", err)
	}

	return MeResponse{
		ID:       user.ID.String(),
		Username: user.Username,
	}, nil
}

func (s *Service) CreateAPIKey(ctx context.Context, userID pgtype.UUID, req CreateAPIKeyRequest) (CreateAPIKeyResponse, error) {
	token, prefix, err := auth.GenerateRegistryAPIKey()
	if err != nil {
		return CreateAPIKeyResponse{}, err
	}

	name := strings.TrimSpace(req.Name)
	row, err := s.queries.CreateAPIKey(ctx, store.CreateAPIKeyParams{
		UserID:    userID,
		KeyHash:   auth.HashKey(token),
		KeyPrefix: prefix,
		Name:      name,
	})
	if err != nil {
		return CreateAPIKeyResponse{}, fmt.Errorf("create api key: %w", err)
	}

	return CreateAPIKeyResponse{
		ID:     row.ID.String(),
		Token:  token,
		Prefix: prefix,
		Name:   name,
	}, nil
}

func (s *Service) ListAPIKeys(ctx context.Context, userID pgtype.UUID) ([]APIKeyListItem, error) {
	rows, err := s.queries.ListAPIKeysByUser(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list api keys: %w", err)
	}

	items := make([]APIKeyListItem, 0, len(rows))
	for _, row := range rows {
		items = append(items, APIKeyListItem{
			ID:        row.ID.String(),
			Prefix:    row.KeyPrefix,
			Name:      row.Name,
			CreatedAt: row.CreatedAt.Time,
		})
	}
	return items, nil
}

func (s *Service) RevokeAPIKey(ctx context.Context, userID, keyID pgtype.UUID) error {
	n, err := s.queries.RevokeAPIKey(ctx, store.RevokeAPIKeyParams{
		ID:     keyID,
		UserID: userID,
	})
	if err != nil {
		return fmt.Errorf("revoke api key: %w", err)
	}
	if n == 0 {
		return ErrAPIKeyNotFound
	}
	return nil
}
