'use client';
import { LazyMotion, domAnimation, MotionConfig, m } from 'motion/react';
import type { ReactNode } from 'react';
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
export function StudioReveal({ children }: { children: ReactNode }) {
  return (
    <m.div
      className="studio-reveal"
      initial={{ opacity: 1, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </m.div>
  );
}
