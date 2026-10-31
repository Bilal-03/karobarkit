import { InfoPage } from '@/components/layout/info-page';
import { GoalGuide } from '@/components/workspace/goal-guide';
import { pageMetadata } from '@/lib/seo';
export const metadata = pageMetadata({
  title: 'Start with your goal',
  description: 'Choose the work you need to finish and get a short, skippable path through the toolkit.',
  path: '/get-started',
});
export default function Page() {
  return (
    <InfoPage
      eyebrow="Your business toolkit"
      title={'Start with your goal'}
      intro={'Choose the work you need to finish and get a short, skippable path through the toolkit.'}
    >
      <GoalGuide />
    </InfoPage>
  );
}
