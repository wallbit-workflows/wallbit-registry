package response

import (
	"encoding/json"
	"log"
	"net/http"
)

const (
	contentTypeJSON = "application/json; charset=utf-8"
	contentTypeYAML = "application/x-yaml; charset=utf-8"
)

type ErrorBody struct {
	Error string `json:"error"`
}

func WriteError(w http.ResponseWriter, status int, message string) {
	WriteJSON(w, status, ErrorBody{Error: message})
}

func Write(w http.ResponseWriter, status int, contentType string, body []byte) {
	w.Header().Set("Content-Type", contentType)
	w.WriteHeader(status)
	if _, err := w.Write(body); err != nil {
		log.Printf("response write: %v", err)
	}
}

func WriteYAML(w http.ResponseWriter, status int, body []byte) {
	Write(w, status, contentTypeYAML, body)
}

func WriteJSON(w http.ResponseWriter, status int, data any) {
	b, err := json.Marshal(data)
	if err != nil {
		log.Printf("json marshal: %v", err)
		Write(w, http.StatusInternalServerError, contentTypeJSON, []byte(`{"error":"internal server error"}`))
		return
	}
	Write(w, status, contentTypeJSON, b)
}
