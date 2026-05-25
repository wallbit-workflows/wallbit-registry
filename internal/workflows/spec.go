package workflows

import (
	"fmt"

	"gopkg.in/yaml.v3"
)

// Workflow spec validation aligned with wallbit-cli internal/workflow/schema.go
// and workflow validate (ParseSpec + ValidateSupportedRuns + ValidateStepInputs).
// https://github.com/wallbit-workflows/wallbit-cli

const (
	specVersion1      = 1
	onErrorFailFast   = "fail_fast"
	onErrorContinue   = "continue"
)

type workflowSpec struct {
	Version int            `yaml:"version"`
	Name    string         `yaml:"name"`
	OnError string         `yaml:"on_error"`
	Steps   []workflowStep `yaml:"steps"`
}

type workflowStep struct {
	ID   string         `yaml:"id"`
	Run  string         `yaml:"run"`
	With map[string]any `yaml:"with"`
}

var supportedRunIDs = map[string]struct{}{
	"rates.get":                        {},
	"balance.get_checking":             {},
	"balance.get_stocks":               {},
	"wallets.get":                      {},
	"assets.list":                      {},
	"assets.get":                       {},
	"account_details.get":              {},
	"transactions.list":                {},
	"cards.list":                       {},
	"cards.block":                      {},
	"cards.unblock":                    {},
	"trades.create":                    {},
	"roboadvisor.deposit":              {},
	"roboadvisor.withdraw":             {},
	"fees.get":                         {},
	"operations.deposit_investment":    {},
	"operations.withdraw_investment":   {},
	"apikey.revoke":                    {},
}

func parseWorkflowSpec(data []byte) (*workflowSpec, error) {
	var spec workflowSpec
	if err := yaml.Unmarshal(data, &spec); err != nil {
		return nil, fmt.Errorf("invalid yaml: %w", err)
	}
	if err := spec.validate(); err != nil {
		return nil, err
	}
	return &spec, nil
}

func (s *workflowSpec) validate() error {
	if s.Version != specVersion1 {
		return fmt.Errorf("unsupported workflow version %d", s.Version)
	}
	if len(s.Steps) == 0 {
		return fmt.Errorf("workflow requires at least one step")
	}
	if s.OnError == "" {
		s.OnError = onErrorFailFast
	}
	if s.OnError != onErrorFailFast && s.OnError != onErrorContinue {
		return fmt.Errorf("invalid on_error %q", s.OnError)
	}
	seen := make(map[string]struct{}, len(s.Steps))
	for i, step := range s.Steps {
		if step.ID == "" {
			return fmt.Errorf("steps[%d].id is required", i)
		}
		if _, ok := seen[step.ID]; ok {
			return fmt.Errorf("duplicate step id %q", step.ID)
		}
		seen[step.ID] = struct{}{}
		if step.Run == "" {
			return fmt.Errorf("steps[%d].run is required", i)
		}
	}
	return nil
}

func validateSupportedRuns(s *workflowSpec) error {
	for i, step := range s.Steps {
		if _, ok := supportedRunIDs[step.Run]; !ok {
			return fmt.Errorf("steps[%d].run %q is not supported", i, step.Run)
		}
	}
	return nil
}
