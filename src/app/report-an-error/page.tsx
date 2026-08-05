import Link from 'next/link';

import { InfoPage } from '@/components/layout/info-page';
import { Button } from '@/components/ui/button';
import { InputField, SelectField, TextareaField } from '@/components/ui/form-field';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Report an error',
  description:
    'Tell KarobarKit about a calculation, source, accessibility or usability issue without sharing private values.',
  path: '/report-an-error',
});

export default function ReportErrorPage() {
  return (
    <InfoPage
      eyebrow="Help us correct it"
      title="Report an error without sending your numbers"
      intro="A good report tells us what tool and version you used, what seemed wrong and what you expected. Please leave out amounts, names, tax IDs and document contents."
    >
      <form className="contact-form" action="/report-an-error" method="post">
        <SelectField id="error-tool" name="tool" label="Tool" defaultValue="cagr-calculator">
          <option value="cagr-calculator">CAGR Calculator</option>
          <option value="roi-calculator">ROI Calculator</option>
          <option value="other">Other / route issue</option>
        </SelectField>
        <SelectField id="error-type" name="type" label="Issue type" defaultValue="calculation">
          <option value="calculation">Calculation or validation</option>
          <option value="source">Source or explanation</option>
          <option value="accessibility">Accessibility</option>
          <option value="layout">Mobile or layout</option>
        </SelectField>
        <InputField
          id="error-version"
          name="version"
          label="Version or review date"
          defaultValue="1.0 · 6 August 2026"
        />
        <TextareaField
          id="error-description"
          name="description"
          label="What happened?"
          rows={7}
          help="Do not paste private inputs. You can describe the shape of the example instead."
          required
        />
        <Button type="submit">Submit report</Button>
        <p className="last-reviewed">
          Need general feedback? <Link href="/contact">Contact us instead</Link>.
        </p>
      </form>
    </InfoPage>
  );
}
