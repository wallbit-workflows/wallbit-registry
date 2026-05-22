package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"time"

	"github.com/wallbit-workflows/wallbit-registry/internal/account"
	"github.com/wallbit-workflows/wallbit-registry/internal/auth"
	"github.com/wallbit-workflows/wallbit-registry/internal/config"
	"github.com/wallbit-workflows/wallbit-registry/internal/db"
	"github.com/wallbit-workflows/wallbit-registry/internal/health"
	"github.com/wallbit-workflows/wallbit-registry/internal/server"
	"github.com/wallbit-workflows/wallbit-registry/internal/store"
	"github.com/wallbit-workflows/wallbit-registry/internal/workflows"
)

func run(ctx context.Context) error {
	ctx, cancel := signal.NotifyContext(ctx, os.Interrupt)
	defer cancel()

	cfg := config.Load()
	if cfg.DatabaseURL == "" {
		return errors.New("DATABASE_URL is required")
	}

	pool, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		return fmt.Errorf("database: %w", err)
	}
	defer db.Close(pool)

	queries := store.New(pool)
	healthHandler := health.New(pool)
	authMiddleware := auth.NewMiddleware(queries)
	accountHandler := account.NewHandler(account.NewService(queries), authMiddleware)
	workflowsHandler := workflows.NewHandler(workflows.NewService(pool, queries), authMiddleware)
	handler := server.New(healthHandler, accountHandler, workflowsHandler)

	httpServer := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: handler,
	}

	errCh := make(chan error, 1)
	go func() {
		log.Printf("listening on %s", httpServer.Addr)
		if err := httpServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errCh <- err
		}
		close(errCh)
	}()

	select {
	case err := <-errCh:
		if err != nil {
			return fmt.Errorf("listen and serve: %w", err)
		}
	case <-ctx.Done():
	}

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		return fmt.Errorf("shutdown: %w", err)
	}

	return nil
}
