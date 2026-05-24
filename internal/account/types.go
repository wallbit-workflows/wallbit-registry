package account

import "time"

type MeResponse struct {
	ID       string  `json:"id"`
	Username *string `json:"username,omitempty"`
}

type UpdateMeRequest struct {
	Username string `json:"username"`
}

type CreateAPIKeyRequest struct {
	Name string `json:"name,omitempty"`
}

type CreateAPIKeyResponse struct {
	ID     string `json:"id"`
	Token  string `json:"token"`
	Prefix string `json:"prefix"`
	Name   string `json:"name"`
}

type APIKeyListItem struct {
	ID        string    `json:"id"`
	Prefix    string    `json:"prefix"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}
