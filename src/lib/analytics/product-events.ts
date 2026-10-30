import { track } from '@vercel/analytics';
import type { AnalyticsEventName, AnalyticsPayload } from './index';

const KEY = 'karobarkit:measurement:v1';
const IDLE_MS = 30 * 60 * 1000;
const channels = ['outreach', 'community'] as const;
interface MeasurementSession {
  id: string;
  lastSeen: number;
  channel: 'outreach' | 'community' | 'direct';
  starts: Record<string, number>;
}

function measurementSession(now: number): MeasurementSession {
  const raw = window.sessionStorage.getItem(KEY);
  if (raw) {
    try {
      const value = JSON.parse(raw) as MeasurementSession;
      if (
        /^[a-f0-9-]{36}$/.test(value.id) &&
        Number.isFinite(value.lastSeen) &&
        now >= value.lastSeen &&
        now - value.lastSeen < IDLE_MS &&
        ['outreach', 'community', 'direct'].includes(value.channel) &&
        value.starts &&
        typeof value.starts === 'object' &&
        !Array.isArray(value.starts)
      )
        return value;
    } catch {
      /* Start a new anonymous session if stored metadata is invalid. */
    }
  }
  const channel = new URL(window.location.href).searchParams.get('kk_channel');
  return {
    id: crypto.randomUUID(),
    lastSeen: now,
    channel: channels.find((candidate) => candidate === channel) ?? 'direct',
    starts: {},
  };
}

/** Explicit owner/test opt-in; persists only for this browser tab. */
export function isVerificationTraffic() {
  if (typeof window === 'undefined') return false;
  const requested = new URL(window.location.href).searchParams.get('kk_traffic') === 'verification';
  try {
    if (requested) window.sessionStorage.setItem('karobarkit:verification:v1', 'true');
    return requested || window.sessionStorage.getItem('karobarkit:verification:v1') === 'true';
  } catch {
    return requested;
  }
}

export function initializeProductMeasurement() {
  isVerificationTraffic();
  if (process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED === 'false')
    return;
  if (
    typeof window === 'undefined' ||
    navigator.doNotTrack === '1' ||
    (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl
  )
    return;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(measurementSession(Date.now())));
  } catch {
    /* Optional measurement storage may be unavailable. */
  }
}

/** Best-effort telemetry must never prevent a calculation or export. No document values enter here. */
export function sendProductEvent(event: AnalyticsEventName, properties: AnalyticsPayload) {
  if (process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED === 'false')
    return;
  if (
    typeof window === 'undefined' ||
    navigator.doNotTrack === '1' ||
    (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl
  )
    return;
  try {
    const now = Date.now();
    const session = measurementSession(now);
    const tool = properties.toolId;
    const previousStart = tool ? session.starts[tool] : undefined;
    const alreadyStarted = Number.isFinite(previousStart) && previousStart! <= now;
    session.lastSeen = now;
    if (tool && event === 'tool_started' && !alreadyStarted) session.starts[tool] = now;
    window.sessionStorage.setItem(KEY, JSON.stringify(session));
    if (event === 'tool_started' && alreadyStarted) return;
    const safe = Object.fromEntries(
      Object.entries(properties).map(([key, value]) => [key, Array.isArray(value) ? value.join(',') : value]),
    );
    track(event, {
      ...safe,
      session_id: session.id,
      channel: session.channel,
      traffic: isVerificationTraffic() ? 'verification' : 'production',
      ...(alreadyStarted ? { elapsed_ms: Math.max(0, now - previousStart!) } : {}),
    });
  } catch {
    /* Disabled storage, unavailable analytics, and ad blockers do not affect the workflow. */
  }
}
