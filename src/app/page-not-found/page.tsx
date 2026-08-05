import { pageMetadata } from '@/lib/seo';
import { NotFoundContent } from '@/components/layout/not-found-content';

export const metadata = pageMetadata({
  title: 'Page not found',
  description: 'Find the canonical KarobarKit tool or return to the home page.',
  path: '/404',
});

export default function FourOhFourPage() {
  return <NotFoundContent />;
}
