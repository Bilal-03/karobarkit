import type { ReactNode } from 'react';
import { toolDiscoveryIndex } from '@/domain/registry';
import { StudioShell } from './studio-shell';
export function SiteShell({ children }: { children: ReactNode }) {
  return <StudioShell tools={toolDiscoveryIndex}>{children}</StudioShell>;
}
