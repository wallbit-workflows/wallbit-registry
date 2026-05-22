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
