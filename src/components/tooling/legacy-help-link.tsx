'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
const helpAnchors = new Set([
  'source-register',
  'source-title',
  'full-limitations',
  'limitations',
  'trust-limitations',
  'tool-trust-title',
  'how-it-works',
  'questions',
]);
export function LegacyHelpLink({ slug }: { slug: string }) {
  const router = useRouter();
  useEffect(() => {
    const visit = () => {
      if (helpAnchors.has(window.location.hash.slice(1)))
        router.replace(`/tools/${slug}/help${window.location.hash}`);
    };
    visit();
    window.addEventListener('hashchange', visit);
    return () => window.removeEventListener('hashchange', visit);
  }, [router, slug]);
  return null;
}
