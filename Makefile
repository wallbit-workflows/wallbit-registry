.PHONY: migrate-up migrate-down migrate-status help

help:
	@echo "Targets: migrate-up, migrate-down, migrate-status"
	@echo "Requires DATABASE_URL in the environment."

migrate-up:
	goose -dir migrations postgres "$(DATABASE_URL)" up

migrate-down:
	goose -dir migrations postgres "$(DATABASE_URL)" down

migrate-status:
	goose -dir migrations postgres "$(DATABASE_URL)" status
