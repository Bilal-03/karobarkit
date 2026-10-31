import { env } from './env';

export const siteConfig = {
  name: 'KarobarKit',
  positioning: 'The Business Toolkit for India',
  description: 'Simple tools for your everyday business paperwork, pricing, and payments. No account needed.',
  url: env.NEXT_PUBLIC_SITE_URL,
};

export function absoluteUrl(path: string) {
  return new URL(path, siteConfig.url).toString();
}
