-- name: GetWorkflowByAuthorAndSlug :one
SELECT
    w.id,
    w.author_id,
    w.slug,
    w.display_name,
    w.description,
    w.latest_version_id,
    w.created_at
FROM workflows w
INNER JOIN users u ON u.id = w.author_id
WHERE u.username = $1
  AND w.slug = $2;

-- name: GetWorkflowByAuthorIDAndSlug :one
SELECT
    id,
    author_id,
    slug,
    display_name,
    description,
    latest_version_id,
    created_at
FROM workflows
WHERE author_id = $1
  AND slug = $2;

-- name: GetWorkflowMetadataByAuthorAndSlug :one
SELECT
    w.slug,
    w.display_name,
    w.description,
    w.created_at AS workflow_created_at,
    wv.version,
    wv.content_sha256,
    wv.created_at AS published_at
FROM workflows w
INNER JOIN users u ON u.id = w.author_id
INNER JOIN workflow_versions wv ON wv.id = w.latest_version_id
WHERE u.username = $1
  AND w.slug = $2;

-- name: ListWorkflows :many
SELECT
    u.username,
    w.slug,
    w.display_name,
    w.description,
    wv.version,
    wv.created_at AS published_at
FROM workflows w
INNER JOIN users u ON u.id = w.author_id
INNER JOIN workflow_versions wv ON wv.id = w.latest_version_id
WHERE w.latest_version_id IS NOT NULL
ORDER BY wv.created_at DESC
LIMIT $1 OFFSET $2;

-- name: CreateWorkflow :one
INSERT INTO workflows (author_id, slug, display_name, description)
VALUES ($1, $2, $3, $4)
RETURNING
    id,
    author_id,
    slug,
    display_name,
    description,
    latest_version_id,
    created_at;

-- name: UpdateWorkflowOnPublish :exec
UPDATE workflows
SET
    display_name = $2,
    description = $3
WHERE id = $1;

-- name: UpdateWorkflowLatestVersion :one
UPDATE workflows w
SET latest_version_id = $2
WHERE w.id = $1
  AND EXISTS (
      SELECT 1
      FROM workflow_versions wv
      WHERE wv.id = $2
        AND wv.workflow_id = w.id
  )
RETURNING
    w.id,
    w.author_id,
    w.slug,
    w.display_name,
    w.description,
    w.latest_version_id,
    w.created_at;
