package account

import (
	"fmt"
	"regexp"
	"strings"
)

var usernamePattern = regexp.MustCompile(`^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$`)

func normalizeUsername(raw string) (string, error) {
	username := strings.ToLower(strings.TrimSpace(raw))
	if !usernamePattern.MatchString(username) {
		return "", fmt.Errorf("%w: username must be 3-32 chars, lowercase letters, numbers, and hyphens", ErrInvalidInput)
	}
	return username, nil
}
