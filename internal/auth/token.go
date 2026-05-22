package auth

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
)

const registryKeyPrefix = "wb_reg_"

func GenerateRegistryAPIKey() (token string, prefix string, err error) {
	b := make([]byte, 24)
	if _, err := rand.Read(b); err != nil {
		return "", "", fmt.Errorf("generate random bytes: %w", err)
	}
	token = registryKeyPrefix + base64.RawURLEncoding.EncodeToString(b)
	if len(token) < 12 {
		prefix = token
	} else {
		prefix = token[:12]
	}
	return token, prefix, nil
}
