package workflows

import "testing"

func TestParseWorkflowSpecDefaultsOnError(t *testing.T) {
	spec, err := parseWorkflowSpec([]byte(`
version: 1
name: test
steps:
  - id: s1
    run: balance.get_checking
`))
	if err != nil {
		t.Fatalf("parseWorkflowSpec() error = %v", err)
	}
	if spec.OnError != onErrorFailFast {
		t.Fatalf("expected default on_error %q, got %q", onErrorFailFast, spec.OnError)
	}
}

func TestValidateSupportedRunsRejectsUnknown(t *testing.T) {
	spec := &workflowSpec{
		Version: 1,
		Name:    "test",
		OnError: onErrorFailFast,
		Steps: []workflowStep{
			{ID: "s1", Run: "balance.get_checking"},
			{ID: "s2", Run: "unknown.run"},
		},
	}
	if err := validateSupportedRuns(spec); err == nil {
		t.Fatal("expected unsupported run validation error")
	}
}

func TestValidateTradesCreateInput(t *testing.T) {
	spec := &workflowSpec{
		Version: 1,
		Name:    "test",
		OnError: onErrorFailFast,
		Steps: []workflowStep{
			{
				ID:  "trade",
				Run: "trades.create",
				With: map[string]any{
					"symbol":     "AAPL",
					"direction":  "BUY",
					"currency":   "USD",
					"order_type": "MARKET",
				},
			},
		},
	}
	if err := validateStepInputs(spec); err == nil {
		t.Fatal("expected trade input validation error when amount/shares missing")
	}

	spec.Steps[0].With["amount"] = 10.0
	spec.Steps[0].With["shares"] = 1.0
	if err := validateStepInputs(spec); err == nil {
		t.Fatal("expected trade input validation error when both amount/shares present")
	}

	delete(spec.Steps[0].With, "shares")
	if err := validateStepInputs(spec); err != nil {
		t.Fatalf("expected valid input, got error: %v", err)
	}
}

func TestValidateWorkflowContentRejectsInvalidYAML(t *testing.T) {
	err := validateWorkflowContent("not: [yaml")
	if err == nil {
		t.Fatal("expected yaml error")
	}
}

func TestValidatePublishVersion(t *testing.T) {
	if err := validatePublishVersion("1.0.0"); err != nil {
		t.Fatalf("valid semver: %v", err)
	}
	if err := validatePublishVersion("v1"); err == nil {
		t.Fatal("expected invalid semver")
	}
}
