package account

import "errors"

var (
	ErrInvalidInput   = errors.New("invalid input")
	ErrUsernameTaken  = errors.New("username already taken")
	ErrAPIKeyNotFound = errors.New("api key not found")
)
