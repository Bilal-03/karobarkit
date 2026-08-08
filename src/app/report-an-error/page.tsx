import Link from 'next/link';

import { InfoPage } from '@/components/layout/info-page';
import { ErrorReportForm } from '@/components/feedback/error-report-form';
import { toolRegistry } from '@/domain/registry';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Report an error',
  description:
    'Tell KarobarKit about a calculation, source, accessibility or usability issue without sharing private values.',
  path: '/report-an-error',
});

interface ReportErrorPageProps {
  searchParams?: Promise<{ tool?: string }>;
}

export default async function ReportErrorPage({ searchParams }: ReportErrorPageProps) {
  const params = searchParams ? await searchParams : {};
  const requestedTool = typeof params.tool === 'string' ? params.tool : '';
  const defaultTool = toolRegistry.some((tool) => tool.slug === requestedTool)
    ? requestedTool
    : toolRegistry[0].slug;
  return (
    <InfoPage
      eyebrow="Help us correct it"
      title="Report an error without sending your numbers"
      intro="A good report tells us what tool and version you used, what seemed wrong and what you expected. Please leave out amounts, names, tax IDs and document contents."
    >
      <ErrorReportForm
        tools={toolRegistry.map(({ slug, name }) => ({ slug, name }))}
        defaultTool={defaultTool}
      />
      <p className="last-reviewed">
        Need general feedback? <Link href="/contact">Contact us instead</Link>.
      </p>
    </InfoPage>
  );
}
