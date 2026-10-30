'use client';

import { useEffect } from 'react';
import { initializeProductMeasurement, isVerificationTraffic } from '@/lib/analytics/product-events';

import { Analytics, type BeforeSendEvent } from '@vercel/analytics/next';

export function removeAnalyticsUrlDetails(event: BeforeSendEvent): BeforeSendEvent | null {
  if (event.type === 'pageview' && isVerificationTraffic()) return null;
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
  useEffect(() => {
    initializeProductMeasurement();
  }, []);
  if (process.env.NODE_ENV !== 'production') return null;

  return <Analytics beforeSend={removeAnalyticsUrlDetails} />;
}
