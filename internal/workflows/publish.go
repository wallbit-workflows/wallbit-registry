package workflows

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strings"

	"gopkg.in/yaml.v3"
)

const MaxWorkflowContentBytes = 256 << 10 // 256 KiB

func validatePublishRequest(req PublishRequest) error {
	if strings.TrimSpace(req.Slug) == "" {
		return fmt.Errorf("%w: slug is required", ErrInvalidInput)
	}
	if strings.TrimSpace(req.Version) == "" {
		return fmt.Errorf("%w: version is required", ErrInvalidInput)
	}
	if strings.TrimSpace(req.Content) == "" {
		return fmt.Errorf("%w: content is required", ErrInvalidInput)
	}
	if len(req.Content) > MaxWorkflowContentBytes {
		return fmt.Errorf("%w: content exceeds %d bytes", ErrInvalidInput, MaxWorkflowContentBytes)
	}
	return nil
}

func contentDigest(content string) string {
	sum := sha256.Sum256([]byte(content))
	return hex.EncodeToString(sum[:])
}

func workflowDisplayName(content, slug string) string {
	var doc struct {
		Name string `yaml:"name"`
	}
	if err := yaml.Unmarshal([]byte(content), &doc); err != nil || strings.TrimSpace(doc.Name) == "" {
		return slug
	}
	return strings.TrimSpace(doc.Name)
}
