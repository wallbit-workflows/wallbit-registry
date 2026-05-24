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

type workflowDocMeta struct {
	Name        string `yaml:"name"`
	Description string `yaml:"description"`
}

func parseWorkflowDoc(content string) workflowDocMeta {
	var doc workflowDocMeta
	_ = yaml.Unmarshal([]byte(content), &doc)
	return doc
}

func workflowDisplayName(content, slug string) string {
	doc := parseWorkflowDoc(content)
	if doc.Name == "" {
		return slug
	}
	return strings.TrimSpace(doc.Name)
}

func workflowDescriptionFromContent(content string) string {
	return strings.TrimSpace(parseWorkflowDoc(content).Description)
}

func resolvePublishDescription(req PublishRequest, content string) string {
	if d := strings.TrimSpace(req.Description); d != "" {
		return d
	}
	return workflowDescriptionFromContent(content)
}
