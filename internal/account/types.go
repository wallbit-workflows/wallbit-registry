package account

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
	Token  string `json:"token"`
	Prefix string `json:"prefix"`
	Name   string `json:"name"`
}
