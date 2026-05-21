package workflows

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/wallbit-workflows/wallbit-registry/internal/store"
)

type Service struct {
	queries *store.Queries
}

func NewService(queries *store.Queries) *Service {
	return &Service{queries: queries}
}

type Metadata struct {
	Username    string    `json:"username"`
	Slug        string    `json:"slug"`
	DisplayName string    `json:"display_name"`
	Description string    `json:"description,omitempty"`
	Version     string    `json:"version"`
	Digest      string    `json:"digest"`
	CreatedAt   time.Time `json:"created_at"`
	PublishedAt time.Time `json:"published_at"`
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
