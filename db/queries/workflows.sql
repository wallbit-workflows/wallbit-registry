-- name: GetWorkflowByAuthorAndSlug :one
SELECT w.*
FROM workflows w
INNER JOIN users u ON u.id = w.author_id
WHERE u.username = $1
AND w.slug = $2;