const enabledFeatureFlags = new Set(
  (process.env.NEXT_PUBLIC_TOOL_FEATURE_FLAGS ?? '')
    .split(',')
    .map((flag) => flag.trim())
    .filter(Boolean),
);

export function isFeatureFlagEnabled(featureFlag?: string) {
  return featureFlag === undefined || enabledFeatureFlags.has(featureFlag);
}
