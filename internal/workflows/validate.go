package workflows

import (
	"fmt"
	"regexp"
	"strings"
)

var publishVersionPattern = regexp.MustCompile(`^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$`)

// validateWorkflowContent mirrors wallbit workflow validate (without executing steps).
func validateWorkflowContent(content string) error {
	spec, err := parseWorkflowSpec([]byte(content))
	if err != nil {
		return err
	}
	if err := validateSupportedRuns(spec); err != nil {
		return err
	}
	return validateStepInputs(spec)
}

func validatePublishVersion(version string) error {
	v := strings.TrimSpace(version)
	if !publishVersionPattern.MatchString(v) {
		return fmt.Errorf("version must be semver (e.g. 1.0.0)")
	}
	return nil
}
