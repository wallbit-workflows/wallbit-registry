-- name: GetLatestWorkflowVersionBySlug :one
SELECT wv.*
FROM workflow_versions wv
INNER JOIN workflows w ON w.id = wv.workflow_id
INNER JOIN users u ON u.id = w.author_id
WHERE u.username = $1
  AND w.slug = $2
  AND wv.id = w.latest_version_id;