import Link from 'next/link';
import { InfoPage } from '@/components/layout/info-page';
export const metadata = { title: 'Research paused', robots: { index: false, follow: true } };
export default function ResearchPage() {
  return (
    <InfoPage
      eyebrow="Project update"
      title="Research recruitment is paused"
      intro="KarobarKit is currently an independent portfolio project. We are not collecting interview interest or booking research sessions."
    >
      <p>
        No customer interviews or research findings are claimed.{' '}
        <Link href="/case-study">Explore the product case study</Link> or{' '}
        <Link href="/contact">share general feedback</Link>.
      </p>
    </InfoPage>
  );
}
