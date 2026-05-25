package workflows

import (
	"fmt"
	"strings"
)

// Per-step input validators from wallbit-cli internal/workflow/registry.go.

func validateStepInputs(s *workflowSpec) error {
	for i, step := range s.Steps {
		var err error
		switch step.Run {
		case "rates.get":
			err = validateRatesGetInput(step.With)
		case "assets.get":
			err = validateAssetsGetInput(step.With)
		case "cards.block", "cards.unblock":
			err = validateCardsBlockInput(step.With)
		case "trades.create":
			err = validateTradesCreateInput(step.With)
		case "roboadvisor.deposit":
			err = validateRoboadvisorDepositInput(step.With)
		case "roboadvisor.withdraw":
			err = validateRoboadvisorWithdrawInput(step.With)
		case "operations.deposit_investment":
			err = validateOperationsDepositInvestmentInput(step.With)
		case "operations.withdraw_investment":
			err = validateOperationsWithdrawInvestmentInput(step.With)
		}
		if err != nil {
			return fmt.Errorf("steps[%d] (%s): %w", i, step.Run, err)
		}
	}
	return nil
}

func withRequiredString(with map[string]any, key string) (string, error) {
	if with == nil {
		return "", fmt.Errorf("with.%s is required", key)
	}
	raw, ok := with[key]
	if !ok {
		return "", fmt.Errorf("with.%s is required", key)
	}
	s, ok := raw.(string)
	if !ok {
		return "", fmt.Errorf("with.%s must be a string", key)
	}
	s = strings.TrimSpace(s)
	if s == "" {
		return "", fmt.Errorf("with.%s is required", key)
	}
	return s, nil
}

func withOptionalFloat(with map[string]any, key string) (float64, bool, error) {
	if with == nil {
		return 0, false, nil
	}
	raw, ok := with[key]
	if !ok || raw == nil {
		return 0, false, nil
	}
	switch v := raw.(type) {
	case float64:
		return v, true, nil
	case float32:
		return float64(v), true, nil
	case int:
		return float64(v), true, nil
	case int64:
		return float64(v), true, nil
	default:
		return 0, false, fmt.Errorf("with.%s must be a number", key)
	}
}

func withRequiredInt(with map[string]any, key string) (int, error) {
	if with == nil {
		return 0, fmt.Errorf("with.%s is required", key)
	}
	raw, ok := with[key]
	if !ok || raw == nil {
		return 0, fmt.Errorf("with.%s is required", key)
	}
	switch v := raw.(type) {
	case int:
		return v, nil
	case int64:
		return int(v), nil
	case float64:
		return int(v), nil
	default:
		return 0, fmt.Errorf("with.%s must be a number", key)
	}
}

func withRequiredFloat(with map[string]any, key string) (float64, error) {
	v, ok, err := withOptionalFloat(with, key)
	if err != nil {
		return 0, err
	}
	if !ok {
		return 0, fmt.Errorf("with.%s is required", key)
	}
	return v, nil
}

func validateRatesGetInput(with map[string]any) error {
	if _, err := withRequiredString(with, "source"); err != nil {
		return err
	}
	_, err := withRequiredString(with, "dest")
	return err
}

func validateAssetsGetInput(with map[string]any) error {
	_, err := withRequiredString(with, "symbol")
	return err
}

func validateCardsBlockInput(with map[string]any) error {
	_, err := withRequiredString(with, "card_uuid")
	return err
}

func validateTradesCreateInput(with map[string]any) error {
	if _, err := withRequiredString(with, "symbol"); err != nil {
		return err
	}
	if _, err := withRequiredString(with, "direction"); err != nil {
		return err
	}
	if _, err := withRequiredString(with, "currency"); err != nil {
		return err
	}
	if _, err := withRequiredString(with, "order_type"); err != nil {
		return err
	}
	_, hasAmount, err := withOptionalFloat(with, "amount")
	if err != nil {
		return err
	}
	_, hasShares, err := withOptionalFloat(with, "shares")
	if err != nil {
		return err
	}
	if hasAmount == hasShares {
		return fmt.Errorf("with.amount or with.shares must be provided (exactly one)")
	}
	return nil
}

func validateRoboadvisorDepositInput(with map[string]any) error {
	if _, err := withRequiredInt(with, "robo_advisor_id"); err != nil {
		return err
	}
	amount, err := withRequiredFloat(with, "amount")
	if err != nil {
		return err
	}
	if amount <= 0 {
		return fmt.Errorf("with.amount must be positive")
	}
	from, err := withRequiredString(with, "from")
	if err != nil {
		return err
	}
	v := strings.ToUpper(strings.TrimSpace(from))
	if v != "DEFAULT" && v != "INVESTMENT" {
		return fmt.Errorf("with.from must be DEFAULT or INVESTMENT")
	}
	return nil
}

func validateRoboadvisorWithdrawInput(with map[string]any) error {
	if _, err := withRequiredInt(with, "robo_advisor_id"); err != nil {
		return err
	}
	amount, err := withRequiredFloat(with, "amount")
	if err != nil {
		return err
	}
	if amount <= 0 {
		return fmt.Errorf("with.amount must be positive")
	}
	to, err := withRequiredString(with, "to")
	if err != nil {
		return err
	}
	v := strings.ToUpper(strings.TrimSpace(to))
	if v != "DEFAULT" && v != "INVESTMENT" {
		return fmt.Errorf("with.to must be DEFAULT or INVESTMENT")
	}
	return nil
}

func validateOperationsDepositInvestmentInput(with map[string]any) error {
	if _, err := withRequiredString(with, "currency"); err != nil {
		return err
	}
	amount, err := withRequiredFloat(with, "amount")
	if err != nil {
		return err
	}
	if amount <= 0 {
		return fmt.Errorf("with.amount must be positive")
	}
	return nil
}

func validateOperationsWithdrawInvestmentInput(with map[string]any) error {
	if _, err := withRequiredString(with, "currency"); err != nil {
		return err
	}
	amount, err := withRequiredFloat(with, "amount")
	if err != nil {
		return err
	}
	if amount <= 0 {
		return fmt.Errorf("with.amount must be positive")
	}
	return nil
}
