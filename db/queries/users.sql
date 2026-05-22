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
