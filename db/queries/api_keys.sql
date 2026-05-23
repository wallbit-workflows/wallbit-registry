-- name: GetAPIKeyByHash :one
SELECT
    id,
    user_id,
    key_prefix
FROM api_keys
WHERE key_hash = $1
  AND revoked_at IS NULL;

-- name: CreateAPIKey :one
INSERT INTO api_keys (user_id, key_hash, key_prefix, name)
VALUES ($1, $2, $3, $4)
RETURNING
    id,
    user_id,
    key_hash,
    key_prefix,
    name,
    created_at,
    revoked_at;

-- name: ListAPIKeysByUser :many
SELECT
    id,
    key_prefix,
    name,
    created_at
FROM api_keys
WHERE user_id = $1
  AND revoked_at IS NULL
ORDER BY created_at DESC;

-- name: RevokeAPIKey :execrows
UPDATE api_keys
SET revoked_at = now()
WHERE id = $1
  AND user_id = $2
  AND revoked_at IS NULL;
