package workflows

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/wallbit-workflows/wallbit-registry/internal/store"
)

type Service struct {
	pool    *pgxpool.Pool
	queries *store.Queries
}

func NewService(pool *pgxpool.Pool, queries *store.Queries) *Service {
	return &Service{pool: pool, queries: queries}
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

func (s *Service) Publish(ctx context.Context, authorID pgtype.UUID, req PublishRequest) (PublishResponse, error) {
	if err := validatePublishRequest(req); err != nil {
		return PublishResponse{}, err
	}

	user, err := s.queries.GetUserByID(ctx, authorID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PublishResponse{}, ErrNotFound
		}
		return PublishResponse{}, fmt.Errorf("get user: %w", err)
	}
	if user.Username == nil || *user.Username == "" {
		return PublishResponse{}, ErrNoUsername
	}

	digest := contentDigest(req.Content)
	displayName := workflowDisplayName(req.Content, req.Slug)

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return PublishResponse{}, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := s.queries.WithTx(tx)

	workflow, err := qtx.GetWorkflowByAuthorIDAndSlug(ctx, store.GetWorkflowByAuthorIDAndSlugParams{
		AuthorID: authorID,
		Slug:     req.Slug,
	})
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return PublishResponse{}, fmt.Errorf("get workflow: %w", err)
	}
	if errors.Is(err, pgx.ErrNoRows) {
		workflow, err = qtx.CreateWorkflow(ctx, store.CreateWorkflowParams{
			AuthorID:    authorID,
			Slug:        req.Slug,
			DisplayName: displayName,
			Description: req.Description,
		})
		if err != nil {
			return PublishResponse{}, fmt.Errorf("create workflow: %w", err)
		}
	} else {
		exists, err := qtx.WorkflowVersionExists(ctx, store.WorkflowVersionExistsParams{
			WorkflowID: workflow.ID,
			Version:    req.Version,
		})
		if err != nil {
			return PublishResponse{}, fmt.Errorf("check workflow version: %w", err)
		}
		if exists {
			return PublishResponse{}, ErrConflict
		}
	}

	version, err := qtx.CreateWorkflowVersion(ctx, store.CreateWorkflowVersionParams{
		WorkflowID:    workflow.ID,
		Version:       req.Version,
		Content:       req.Content,
		ContentSha256: digest,
	})
	if err != nil {
		return PublishResponse{}, fmt.Errorf("create workflow version: %w", err)
	}

	_, err = qtx.UpdateWorkflowLatestVersion(ctx, store.UpdateWorkflowLatestVersionParams{
		ID:              workflow.ID,
		LatestVersionID: version.ID,
	})
	if err != nil {
		return PublishResponse{}, fmt.Errorf("update latest version: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return PublishResponse{}, fmt.Errorf("commit tx: %w", err)
	}

	return PublishResponse{
		Username: *user.Username,
		Slug:     req.Slug,
		Version:  req.Version,
		Digest:   digest,
	}, nil
}
