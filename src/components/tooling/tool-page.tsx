import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { JsonLd } from '@/components/seo/json-ld';
import { toolStructuredData } from '@/lib/structured-data';
import { ToolInteraction } from './tool-renderers';
import { StudioReveal } from '@/components/ui/studio-motion';
import { LegacyHelpLink } from './legacy-help-link';
import { toolPresentations } from '@/domain/registry/presentation';
import type { SupportedTool } from './tool-types';
export function ToolPage({ tool }: { tool: SupportedTool }) {
  if (!toolPresentations[tool.id]) throw new Error(`Missing presentation for ${tool.id}`);
  return (
    <Container>
      <JsonLd data={toolStructuredData(tool)} />
      <LegacyHelpLink slug={tool.slug} />
      <div className="workspace-heading">
        <div>
          <Link href="/tools" className="workspace-back">
            All tools / {tool.categoryLabel}
          </Link>
          <h1>
            {tool.name}
            {tool.lifecycle === 'beta' && <span className="workspace-beta">Beta</span>}
          </h1>
        </div>
      </div>
      <StudioReveal>
        <ToolInteraction
          tool={{
            id: tool.id,
            name: tool.name,
            category: tool.category,
            defaultValues: tool.defaultValues,
            privacyNote: tool.privacyNote,
            sources: tool.sources,
            ui: tool.ui,
          }}
        />
      </StudioReveal>
    </Container>
  );
}
