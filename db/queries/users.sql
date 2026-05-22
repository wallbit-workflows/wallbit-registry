-- name: GetUserByID :one
SELECT
    id,
    username,
    clerk_user_id,
    created_at
FROM users
WHERE id = $1;
