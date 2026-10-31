import { InfoPage } from '@/components/layout/info-page';
import { DecisionWorkbench } from '@/components/workspace/decision-workbench';
import { pageMetadata } from '@/lib/seo';
export const metadata = pageMetadata({
  title: 'Compare business decisions',
  description: 'Compare price, discounts, delivery costs and expected volume before choosing your next step.',
  path: '/decision-workbench',
});
export default function Page() {
  return (
    <InfoPage
      eyebrow="Your business toolkit"
      title={'Compare business decisions'}
      intro={'Compare price, discounts, delivery costs and expected volume before choosing your next step.'}
    >
      <DecisionWorkbench />
    </InfoPage>
  );
}
