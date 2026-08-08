import { env } from './env';

export const siteConfig = {
  name: 'KarobarKit',
  positioning: 'The Business Toolkit for India',
  description:
    'Trusted calculators, generators and operational tools for Indian freelancers, sellers, founders and small businesses.',
  url: env.NEXT_PUBLIC_SITE_URL,
};

export function absoluteUrl(path: string) {
  return new URL(path, siteConfig.url).toString();
}
