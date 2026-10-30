import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { track } from '@vercel/analytics';
import { initializeProductMeasurement, isVerificationTraffic } from '@/lib/analytics/product-events';
import { removeAnalyticsUrlDetails } from '@/components/analytics/vercel-web-analytics';
import { trackEvent } from '@/lib/analytics';
vi.mock('@vercel/analytics', () => ({ track: vi.fn() }));

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED', 'true');
  sessionStorage.clear();
  vi.mocked(track).mockReset();
  history.replaceState({}, '', '/freelancers?kk_channel=outreach&private=secret');
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
  history.replaceState({}, '', '/');
});

describe('persistent product measurement', () => {
  it('strips private properties, deduplicates starts and times exports in a tab session', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-31T12:00:00Z'));
    trackEvent('tool_started', { toolId: 'quotation-generator', amount: '100', customer: 'Private' });
    trackEvent('tool_started', { toolId: 'quotation-generator' });
    vi.advanceTimersByTime(1200);
    trackEvent('result_downloaded', { toolId: 'quotation-generator', format: 'pdf', rawInput: 'secret' });
    expect(track).toHaveBeenCalledTimes(2);
    const data = vi.mocked(track).mock.calls[1][1];
    expect(data).toMatchObject({
      toolId: 'quotation-generator',
      format: 'pdf',
      channel: 'outreach',
      elapsed_ms: 1200,
    });
    expect(data).not.toHaveProperty('rawInput');
    expect(JSON.stringify(vi.mocked(track).mock.calls)).not.toMatch(/Private|secret/);
    expect(data?.session_id).toBe(vi.mocked(track).mock.calls[0][1]?.session_id);
  });
  it('retains allowlisted landing attribution after navigation to a tool', () => {
    initializeProductMeasurement();
    expect(track).not.toHaveBeenCalled();
    history.replaceState({}, '', '/tools/quotation-generator');
    trackEvent('tool_started', { toolId: 'quotation-generator' });
    expect(vi.mocked(track).mock.calls[0][1]?.channel).toBe('outreach');
  });
  it('labels verification traffic across navigation without exposing the query string', () => {
    history.replaceState({}, '', '/freelancers?kk_traffic=verification');
    expect(isVerificationTraffic()).toBe(true);
    history.replaceState({}, '', '/tools/quotation-generator');
    trackEvent('tool_started', { toolId: 'quotation-generator' });
    expect(vi.mocked(track).mock.calls[0][1]?.traffic).toBe('verification');
  });
  it('excludes marked page views while retaining sanitized custom verification events', () => {
    history.replaceState({}, '', '/freelancers?kk_traffic=verification');
    expect(removeAnalyticsUrlDetails({ type: 'pageview', url: location.href })).toBeNull();
    history.replaceState({}, '', '/tools/invoice-generator');
    expect(removeAnalyticsUrlDetails({ type: 'pageview', url: location.href })).toBeNull();
  });
  it('expires identifiers after inactivity and ignores unrecognized channels', () => {
    vi.useFakeTimers();
    history.replaceState({}, '', '/?kk_channel=private-name');
    trackEvent('tool_viewed', { toolId: 'invoice-generator' });
    const first = vi.mocked(track).mock.calls[0][1];
    expect(first?.channel).toBe('direct');
    vi.advanceTimersByTime(31 * 60 * 1000);
    trackEvent('tool_viewed', { toolId: 'invoice-generator' });
    expect(vi.mocked(track).mock.calls[1][1]?.session_id).not.toBe(first?.session_id);
  });
  it('does not send from development or when explicitly disabled', () => {
    vi.stubEnv('NODE_ENV', 'development');
    trackEvent('tool_started');
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED', 'false');
    trackEvent('tool_started');
    expect(track).not.toHaveBeenCalled();
  });
  it('honors privacy signals and fails safely when telemetry throws', () => {
    Object.defineProperty(navigator, 'doNotTrack', { configurable: true, value: '1' });
    trackEvent('tool_started');
    expect(track).not.toHaveBeenCalled();
    Object.defineProperty(navigator, 'doNotTrack', { configurable: true, value: undefined });
    vi.mocked(track).mockImplementation(() => {
      throw new Error('Unavailable');
    });
    expect(() => trackEvent('tool_started')).not.toThrow();
  });
});
