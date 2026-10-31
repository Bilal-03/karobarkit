import { InfoPage } from '@/components/layout/info-page';
import { WorkspaceManager } from '@/components/workspace/workspace-manager';
import { pageMetadata } from '@/lib/seo';
export const metadata = pageMetadata({
  title: 'Your device workspace',
  description:
    'Optionally save business details, document drafts and comparisons in this browser. No account needed.',
  path: '/workspace',
});
export default function Page() {
  return (
    <InfoPage
      eyebrow="Your business toolkit"
      title={'Your device workspace'}
      intro={
        'Optionally save business details, document drafts and comparisons in this browser. No account needed.'
      }
    >
      <WorkspaceManager />
    </InfoPage>
  );
}
