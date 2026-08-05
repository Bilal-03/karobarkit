import { env } from './env';

export const siteConfig = {
  name: 'KarobarKit',
  description: 'Private, practical business tools for Indian freelancers, retailers and small businesses.',
  url: env.NEXT_PUBLIC_SITE_URL,
};

export function absoluteUrl(path: string) {
  return new URL(path, siteConfig.url).toString();
}
