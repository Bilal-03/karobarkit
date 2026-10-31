import { InfoPage } from '@/components/layout/info-page';
import { WorkspaceManager } from '@/components/workspace/workspace-manager';
import { pageMetadata } from '@/lib/seo';
export const metadata = pageMetadata({
  title: 'Saved drafts',
  description: 'Continue your paperwork and reuse business details. Saved in this browser only.',
  path: '/workspace',
});
export default function Page() {
  return (
    <InfoPage
      eyebrow="Your business toolkit"
      title={'Saved drafts'}
      intro={'Continue your paperwork and reuse business details. Saved in this browser only.'}
    >
      <WorkspaceManager />
    </InfoPage>
  );
}
