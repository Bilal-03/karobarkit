const configuredFlags = process.env.NEXT_PUBLIC_TOOL_FEATURE_FLAGS;
const enabledFeatureFlags = new Set(
  (configuredFlags === undefined ? ['phase4-tax-review'] : configuredFlags.split(','))
    .map((flag) => flag.trim())
    .filter(Boolean),
);

// Phase 4 is a public controlled beta for this personal project. Set the environment
// variable explicitly (including an empty value) when a deployment needs to opt out.

export function isFeatureFlagEnabled(featureFlag?: string) {
  return featureFlag === undefined || enabledFeatureFlags.has(featureFlag);
}
