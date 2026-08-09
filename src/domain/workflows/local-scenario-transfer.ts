export interface LocalScenarioTransfer {
  version: 1;
  sourceToolId: string;
  sourceToolName: string;
  sourceKind: string;
  savedAt: string;
  values: Record<string, string>;
}

const TRANSFER_KEY = 'karobarkit:scenario-transfer:v1';
const MAX_TRANSFER_BYTES = 32_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseTransfer(value: unknown): LocalScenarioTransfer | null {
  if (!isRecord(value)) return null;
  if (value.version !== 1) return null;
  if (typeof value.sourceToolId !== 'string' || typeof value.sourceToolName !== 'string') return null;
  if (typeof value.sourceKind !== 'string' || typeof value.savedAt !== 'string') return null;
  if (!isRecord(value.values)) return null;

  const values = Object.fromEntries(
    Object.entries(value.values).filter(([, item]) => typeof item === 'string'),
  ) as Record<string, string>;
  return { ...value, values } as LocalScenarioTransfer;
}

export function saveLocalScenarioTransfer(
  transfer: Omit<LocalScenarioTransfer, 'version' | 'savedAt'>,
): boolean {
  if (typeof window === 'undefined') return false;
  const payload: LocalScenarioTransfer = {
    ...transfer,
    version: 1,
    savedAt: new Date().toISOString(),
  };
  try {
    const serialized = JSON.stringify(payload);
    if (serialized.length > MAX_TRANSFER_BYTES) return false;
    window.sessionStorage.setItem(TRANSFER_KEY, serialized);
    return true;
  } catch {
    return false;
  }
}

export function readLocalScenarioTransfer(): LocalScenarioTransfer | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(TRANSFER_KEY);
    if (!raw || raw.length > MAX_TRANSFER_BYTES) return null;
    return parseTransfer(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function clearLocalScenarioTransfer() {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(TRANSFER_KEY);
  } catch {
    // Storage can be disabled by the browser; there is nothing else to clear.
  }
}

export function selectSharedScenarioValues(values: Record<string, string>, fieldNames: readonly string[]) {
  const allowed = new Set(fieldNames);
  return Object.fromEntries(
    Object.entries(values).filter(([field, value]) => allowed.has(field) && typeof value === 'string'),
  ) as Record<string, string>;
}
