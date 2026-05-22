package workflows

import "errors"

var (
	ErrNotFound      = errors.New("workflow not found")
	ErrConflict      = errors.New("workflow version already exists")
	ErrInvalidInput  = errors.New("invalid input")
	ErrNoUsername    = errors.New("username not set")
)
