-- name: GetUserByID :one
SELECT
    id,
    username,
    created_at
FROM users
WHERE id = $1;

-- name: GetUserByUsername :one
SELECT
    id,
    username,
    created_at
FROM users
WHERE username = $1;

-- name: CreateUser :one
INSERT INTO users DEFAULT VALUES
RETURNING
    id,
    username,
    created_at;

-- name: UpdateUserUsername :one
UPDATE users
SET username = $2
WHERE id = $1
RETURNING
    id,
    username,
    created_at;

-- name: GetOrCreateUserByClerkID :one
INSERT INTO users (clerk_user_id)
VALUES ($1)
ON CONFLICT (clerk_user_id) DO UPDATE
SET clerk_user_id = EXCLUDED.clerk_user_id
RETURNING
    id,
    username,
    created_at;
