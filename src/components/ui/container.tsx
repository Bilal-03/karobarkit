import type { HTMLAttributes, ReactNode } from 'react';

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  narrow?: boolean;
}

export function Container({ children, narrow = false, className = '', ...props }: ContainerProps) {
  return (
    <div
      className={`container${narrow ? ' container--narrow' : ''}${className ? ` ${className}` : ''}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface SectionProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  eyebrow?: string;
  title?: string;
  description?: string;
}

export function Section({ children, eyebrow, title, description, className = '', ...props }: SectionProps) {
  return (
    <section className={`section${className ? ` ${className}` : ''}`} {...props}>
      {eyebrow || title || description ? (
        <div className="section__heading">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          {title ? <h2>{title}</h2> : null}
          {description ? <p className="section__description">{description}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
