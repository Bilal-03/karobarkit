const configuredFlags = process.env.NEXT_PUBLIC_TOOL_FEATURE_FLAGS;
const enabledFeatureFlags = new Set(
  (configuredFlags === undefined
    ? [
        'phase4-tax-review',
        'phase5-startup-marketplace',
        'phase5-marketplace',
        'phase6-ai-assistants',
        'everyday-utilities-wave',
        'sharing-file-utilities-wave',
        'retail-workplace-wave',
        'regulated-utilities-wave',
      ]
    : configuredFlags.split(',')
  )
    .map((flag) => flag.trim())
    .filter(Boolean),
);

// This personal project keeps the reviewed foundation and controlled-beta utilities visible by default.
// Set NEXT_PUBLIC_TOOL_FEATURE_FLAGS explicitly (including an empty value) when a deployment needs to opt out.

export function isFeatureFlagEnabled(featureFlag?: string) {
  return featureFlag === undefined || enabledFeatureFlags.has(featureFlag);
}
