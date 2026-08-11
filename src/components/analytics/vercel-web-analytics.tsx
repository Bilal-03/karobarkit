'use client';

import { Analytics, type BeforeSendEvent } from '@vercel/analytics/next';

export function removeAnalyticsUrlDetails(event: BeforeSendEvent): BeforeSendEvent {
  try {
    const url = new URL(event.url);
    url.search = '';
    url.hash = '';
    return { ...event, url: url.toString() };
  } catch {
    return event;
  }
}

export function VercelWebAnalytics() {
  if (process.env.NODE_ENV !== 'production') return null;

  return <Analytics beforeSend={removeAnalyticsUrlDetails} />;
}
