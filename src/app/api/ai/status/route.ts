import { getAIProviderStatus } from '@/domain/ai/gateway';
import { PHASE6_FEATURE_FLAG } from '@/domain/registry/tools/phase6';
import { isFeatureFlagEnabled } from '@/domain/registry/feature-flags';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isFeatureFlagEnabled(PHASE6_FEATURE_FLAG)) {
    return Response.json(
      { enabled: false, mode: 'deterministic-fallback', providers: [] },
      { status: 404, headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  }

  return Response.json(getAIProviderStatus(), {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
