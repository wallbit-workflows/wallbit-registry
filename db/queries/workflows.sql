-- name: GetWorkflowByAuthorAndSlug :one
SELECT w.*
FROM workflows w
INNER JOIN users u ON u.id = w.author_id
WHERE u.username = $1
AND w.slug = $2;

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
ORDER BY wv.created_at DESC
LIMIT $1 OFFSET $2;