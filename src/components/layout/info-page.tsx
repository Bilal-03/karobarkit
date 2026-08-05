import type { ReactNode } from 'react';

import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Container, Section } from '@/components/ui/container';

interface InfoPageProps {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}

export function InfoPage({ eyebrow, title, intro, children }: InfoPageProps) {
  return (
    <>
      <div className="page-topline">
        <Container>
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: title }]} />
        </Container>
      </div>
      <section className="info-hero">
        <Container narrow>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="lede">{intro}</p>
        </Container>
      </section>
      <Container narrow>
        <Section>{children}</Section>
      </Container>
    </>
  );
}
