package workflows

import "time"

type Metadata struct {
	Username    string    `json:"username"`
	Slug        string    `json:"slug"`
	DisplayName string    `json:"display_name"`
	Description string    `json:"description,omitempty"`
	Version     string    `json:"version"`
	Digest      string    `json:"digest"`
	CreatedAt   time.Time `json:"created_at"`
	PublishedAt time.Time `json:"published_at"`
}

type ListItem struct {
	Username    string    `json:"username"`
	Slug        string    `json:"slug"`
	DisplayName string    `json:"display_name"`
	Description string    `json:"description,omitempty"`
	Version     string    `json:"version"`
	PublishedAt time.Time `json:"published_at"`
}

type ListResponse struct {
	Items  []ListItem `json:"items"`
	Limit  int        `json:"limit"`
	Offset int        `json:"offset"`
}
