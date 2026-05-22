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

func (s *Service) Get(ctx context.Context, username, slug string) (Metadata, error) {
	workflow, err := s.queries.GetWorkflowMetadataByAuthorAndSlug(ctx, store.GetWorkflowMetadataByAuthorAndSlugParams{
		Username: &username,
		Slug:     slug,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Metadata{}, ErrNotFound
		}
		return Metadata{}, fmt.Errorf("get workflow metadata: %w", err)
	}

	return Metadata{
		Username:    username,
		Slug:        workflow.Slug,
		DisplayName: workflow.DisplayName,
		Description: workflow.Description,
		Version:     workflow.Version,
		Digest:      workflow.ContentSha256,
		CreatedAt:   workflow.WorkflowCreatedAt.Time,
		PublishedAt: workflow.PublishedAt.Time,
	}, nil
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

func (s *Service) List(ctx context.Context, limit, offset int) ([]ListItem, error) {
	rows, err := s.queries.ListWorkflows(ctx, store.ListWorkflowsParams{
		Limit:  int32(limit),
		Offset: int32(offset),
	})
	if err != nil {
		return nil, fmt.Errorf("list workflows: %w", err)
	}

	items := make([]ListItem, 0, len(rows))
	for _, row := range rows {
		items = append(items, listItemFromRow(row))
	}
	return items, nil
}

func listItemFromRow(row store.ListWorkflowsRow) ListItem {
	return ListItem{
		Username:    *row.Username,
		Slug:        row.Slug,
		DisplayName: row.DisplayName,
		Description: row.Description,
		Version:     row.Version,
		PublishedAt: row.PublishedAt.Time,
	}
}
