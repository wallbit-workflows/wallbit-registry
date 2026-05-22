-- name: GetAPIKeyByHash :one
SELECT
    id,
    user_id,
    key_prefix
FROM api_keys
WHERE key_hash = $1
  AND revoked_at IS NULL;
