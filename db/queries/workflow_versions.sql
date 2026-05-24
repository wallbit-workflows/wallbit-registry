-- name: GetLatestWorkflowVersionBySlug :one
SELECT
    wv.id,
    wv.workflow_id,
    wv.version,
    wv.content,
    wv.content_sha256,
    wv.created_at
FROM workflows w
INNER JOIN users u ON u.id = w.author_id
INNER JOIN workflow_versions wv ON wv.id = w.latest_version_id
WHERE u.username = $1
  AND w.slug = $2;

-- name: GetWorkflowVersionByAuthorSlugAndVersion :one
SELECT
    wv.id,
    wv.workflow_id,
    wv.version,
    wv.content,
    wv.content_sha256,
    wv.created_at
FROM workflows w
INNER JOIN users u ON u.id = w.author_id
INNER JOIN workflow_versions wv ON wv.workflow_id = w.id
WHERE u.username = $1
  AND w.slug = $2
  AND wv.version = $3;

-- name: CreateWorkflowVersion :one
INSERT INTO workflow_versions (workflow_id, version, content, content_sha256)
VALUES ($1, $2, $3, $4)
RETURNING
    id,
    workflow_id,
    version,
    content,
    content_sha256,
    created_at;

-- name: WorkflowVersionExists :one
SELECT EXISTS (
    SELECT 1
    FROM workflow_versions
    WHERE workflow_id = $1
      AND version = $2
) AS version_exists;
