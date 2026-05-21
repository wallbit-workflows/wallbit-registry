package workflows

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/wallbit-workflows/wallbit-registry/internal/store"
)

type Service struct {
	queries *store.Queries
}

func NewService(queries *store.Queries) *Service {
	return &Service{queries: queries}
}

func (s *Service) Download(ctx context.Context, username, slug string) (content string, err error) {
	version, err := s.queries.GetLatestWorkflowVersionBySlug(ctx, store.GetLatestWorkflowVersionBySlugParams{
		Username: &username,
		Slug:     slug,
	})

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", ErrNotFound
		}
		return "", fmt.Errorf("get workflow version: %w", err)
	}

	return version.Content, nil
}
