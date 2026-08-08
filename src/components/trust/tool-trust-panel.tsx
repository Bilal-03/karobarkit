import Link from 'next/link';

import { formatIndianDate } from '@/domain/formatting/indian';
import type {
  SourceReference,
  ToolExecutionMode,
  ToolGovernance,
  ToolTrustMetadata,
} from '@/domain/registry/types';

interface ToolTrustPanelProps {
  slug: string;
  formula: string;
  trust: ToolTrustMetadata;
  governance: ToolGovernance;
  sources: SourceReference[];
  limitations: string[];
  privacyNote: string;
  executionMode: ToolExecutionMode;
}

const executionLabels: Record<ToolExecutionMode, string> = {
  'local-only': 'Runs locally in this browser',
  'local-with-bundled-data': 'Runs locally with reviewed bundled data',
  'network-required': 'Uses a network service after disclosure',
  'optional-cloud-sync': 'Local by default; cloud sync is optional',
};

function reviewerLabel(trust: ToolTrustMetadata) {
  const { reviewer } = trust;
  if (reviewer.status === 'approved') {
    return `Approved by ${reviewer.name ?? reviewer.role}${reviewer.reviewedOn ? ` on ${formatIndianDate(reviewer.reviewedOn)}` : ''}`;
  }
  if (reviewer.status === 'pending') return `${reviewer.role}: external review pending`;
  return `${reviewer.role}: specialist approval not required`;
}

function effectivePeriod(trust: ToolTrustMetadata) {
  if (!trust.effectiveFrom) return 'Formula-based; no statutory effective period';
  return `${formatIndianDate(trust.effectiveFrom)}${trust.effectiveTo ? ` to ${formatIndianDate(trust.effectiveTo)}` : ' onward'}`;
}

export function ToolTrustPanel({
  slug,
  formula,
  trust,
  governance,
  sources,
  limitations,
  privacyNote,
  executionMode,
}: ToolTrustPanelProps) {
  const officialSourceCount = sources.filter((source) => source.evidenceLevel === 'official').length;

  return (
    <section className="tool-trust-panel" aria-labelledby="tool-trust-title">
      <div className="tool-trust-panel__heading">
        <div>
          <p className="eyebrow">Trust record</p>
          <h2 id="tool-trust-title">Check the method before you rely on the result</h2>
        </div>
        <span className="trust-status">
          Tier {governance.riskTier} · {executionLabels[executionMode]}
        </span>
      </div>
      <dl className="trust-facts">
        <div>
          <dt>Method</dt>
          <dd>{trust.method}</dd>
          <dd className="trust-facts__detail">{formula}</dd>
        </div>
        <div>
          <dt>Sources</dt>
          <dd>
            {sources.length} reviewed reference{sources.length === 1 ? '' : 's'}
            {officialSourceCount ? ` · ${officialSourceCount} official` : ''}
          </dd>
          <dd className="trust-facts__detail">
            <a href="#source-register">Open the source register</a>
          </dd>
        </div>
        <div>
          <dt>Effective period</dt>
          <dd>{effectivePeriod(trust)}</dd>
        </div>
        <div>
          <dt>Last verified</dt>
          <dd>{formatIndianDate(trust.lastVerified)}</dd>
          <dd className="trust-facts__detail">Review every {governance.reviewCadenceDays} days</dd>
        </div>
        <div>
          <dt>Reviewer status</dt>
          <dd>{reviewerLabel(trust)}</dd>
        </div>
        <div>
          <dt>Privacy</dt>
          <dd>{privacyNote}</dd>
        </div>
      </dl>
      <div className="tool-trust-panel__limits" id="limitations">
        <strong>Important limitations</strong>
        <ul className="plain-list">
          {limitations.slice(0, 2).map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
        </ul>
      </div>
      <p className="tool-trust-panel__actions">
        <a href="#full-limitations">Read all limitations</a>
        <span aria-hidden="true"> · </span>
        <Link href={`/report-an-error?tool=${slug}`}>Report an error</Link>
      </p>
    </section>
  );
}
