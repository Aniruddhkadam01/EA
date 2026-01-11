import React from 'react';

import { Modal, message } from 'antd';

import { EaRepository, type EaObject, type EaRelationship } from '@/pages/dependency-view/utils/eaRepository';
import {
  type EaRepositoryMetadata,
  validateRepositoryMetadata,
} from '@/repository/repositoryMetadata';
import { getReadOnlyReason, isAnyObjectTypeWritableForScope } from '@/repository/architectureScopePolicy';

import { buildGovernanceDebt } from './governanceValidation';
import { appendGovernanceLog } from './governanceLog';

export type EaRepositoryContextValue = {
  eaRepository: EaRepository | null;
  metadata: EaRepositoryMetadata | null;
  loading: boolean;
  setEaRepository: React.Dispatch<React.SetStateAction<EaRepository | null>>;
  createNewRepository: (input: Omit<EaRepositoryMetadata, 'createdAt'>) => { ok: true } | { ok: false; error: string };
  loadRepositoryFromJsonText: (jsonText: string) => { ok: true } | { ok: false; error: string };
  clearRepository: () => void;

  /** Repository-level history (undo/redo). */
  canUndo: boolean;
  canRedo: boolean;
  undo: () => boolean;
  redo: () => boolean;
};

const EaRepositoryContext = React.createContext<EaRepositoryContextValue | undefined>(undefined);

const STORAGE_KEY = 'ea.repository.snapshot.v1';
const HISTORY_LIMIT = 50;

const stableStringify = (value: unknown): string => {
  if (value === null) return 'null';
  const t = typeof value;
  if (t === 'string') return JSON.stringify(value);
  if (t === 'number' || t === 'boolean') return String(value);
  if (t === 'undefined') return 'undefined';
  if (t !== 'object') return JSON.stringify(value);

  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;

  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort((a, b) => a.localeCompare(b));
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
};

const hasReadOnlyObjectChanges = (
  prev: EaRepository | null,
  next: EaRepository | null,
  architectureScope: EaRepositoryMetadata['architectureScope'] | null,
): boolean => {
  if (architectureScope !== 'Business Unit' && architectureScope !== 'Domain') return false;
  if (!prev || !next) return false;

  // In scoped modes, block any add/remove/change to objects outside the scope's writable layers.
  const prevById = prev.objects;
  const nextById = next.objects;

  const ids = new Set<string>();
  for (const id of prevById.keys()) ids.add(id);
  for (const id of nextById.keys()) ids.add(id);

  for (const id of ids) {
    const a = prevById.get(id);
    const b = nextById.get(id);

    const typeA = (a?.type ?? null) as string | null;
    const typeB = (b?.type ?? null) as string | null;

    // If either side is a non-writable type, any structural change is not allowed.
    const writableA = isAnyObjectTypeWritableForScope(architectureScope, typeA);
    const writableB = isAnyObjectTypeWritableForScope(architectureScope, typeB);

    if (!writableA || !writableB) {
      if (!a || !b) return true;
      if (a.type !== b.type) return true;
      const attrsA = stableStringify(a.attributes ?? {});
      const attrsB = stableStringify(b.attributes ?? {});
      if (attrsA !== attrsB) return true;
    }
  }

  return false;
};

const freezeMetadata = (metadata: EaRepositoryMetadata): EaRepositoryMetadata => {
  // Shallow-freeze is sufficient: metadata is primitives only.
  return Object.freeze({ ...metadata });
};

type SerializedRepository = {
  version: 1;
  metadata: EaRepositoryMetadata;
  objects: EaObject[];
  relationships: EaRelationship[];
  updatedAt: string;
};

const serializeRepository = (repo: EaRepository, metadata: EaRepositoryMetadata): SerializedRepository => {
  return {
    version: 1,
    metadata,
    objects: Array.from(repo.objects.values()).map((o) => ({ id: o.id, type: o.type, attributes: { ...(o.attributes ?? {}) } })),
    relationships: repo.relationships.map((r) => ({
      fromId: r.fromId,
      toId: r.toId,
      type: r.type,
      attributes: { ...(r.attributes ?? {}) },
    })),
    updatedAt: new Date().toISOString(),
  };
};

const tryDeserializeRepository = (
  value: unknown,
): { ok: true; repo: EaRepository; metadata: EaRepositoryMetadata } | { ok: false; error: string } => {
  const asAny = value as any;

  const metaRes = validateRepositoryMetadata(asAny?.metadata);
  if (!metaRes.ok) return metaRes;

  const objects = Array.isArray(asAny?.objects) ? (asAny.objects as EaObject[]) : undefined;
  const relationships = Array.isArray(asAny?.relationships) ? (asAny.relationships as EaRelationship[]) : undefined;

  if (!objects || !relationships) {
    return { ok: false, error: 'Invalid repository snapshot: expected { objects, relationships }.' };
  }

  try {
    const repo = new EaRepository({ objects, relationships });
    return { ok: true, repo, metadata: metaRes.metadata };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Failed to load repository snapshot.' };
  }
};

export const EaRepositoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initial = React.useMemo(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { repo: null as EaRepository | null, metadata: null as EaRepositoryMetadata | null, raw: null as string | null };
      const parsed = JSON.parse(raw) as SerializedRepository;
      const res = tryDeserializeRepository(parsed);
      if (!res.ok) return { repo: null as EaRepository | null, metadata: null as EaRepositoryMetadata | null, raw: null as string | null };
      return { repo: res.repo, metadata: res.metadata, raw };
    } catch {
      return { repo: null as EaRepository | null, metadata: null as EaRepositoryMetadata | null, raw: null as string | null };
    }
  }, []);

  const [eaRepository, setEaRepositoryState] = React.useState<EaRepository | null>(() => initial.repo);
  const [metadata, setMetadata] = React.useState<EaRepositoryMetadata | null>(() => initial.metadata);
  const [loading] = React.useState(false);

  const [canUndo, setCanUndo] = React.useState(false);
  const [canRedo, setCanRedo] = React.useState(false);

  const undoStackRef = React.useRef<string[]>([]);
  const redoStackRef = React.useRef<string[]>([]);
  const lastSerializedRef = React.useRef<string | null>(initial.raw);
  const suppressHistoryRef = React.useRef(false);
  const lastSaveBlockedKeyRef = React.useRef<string | null>(null);
  const saveBlockedModalRef = React.useRef<{ destroy: () => void } | null>(null);
  const lastAdvisoryWarnKeyRef = React.useRef<string | null>(null);

  const setEaRepositoryUnsafe: React.Dispatch<React.SetStateAction<EaRepository | null>> = React.useCallback((next) => {
    setEaRepositoryState(next);
  }, []);

  const setEaRepository: React.Dispatch<React.SetStateAction<EaRepository | null>> = React.useCallback(
    (next) => {
      setEaRepositoryState((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: EaRepository | null) => EaRepository | null)(prev) : next;

        // Always allow clearing.
        if (resolved === null) return resolved;

        const scope = metadata?.architectureScope ?? null;
        if (!hasReadOnlyObjectChanges(prev, resolved, scope)) return resolved;

        if (scope === 'Domain') {
          message.warning('Read-only in Domain scope: only Application + Technology layers are editable.');
        } else {
          message.warning('Read-only in Business Unit scope: only Business + Application layers are editable.');
        }
        return prev;
      });
    },
    [metadata?.architectureScope],
  );

  const loadRepositoryFromJsonText = React.useCallback((jsonText: string) => {
    try {
      const parsed = JSON.parse(jsonText) as unknown;
      const res = tryDeserializeRepository(parsed);
      if (!res.ok) return res;

      // New load is a new history root.
      undoStackRef.current = [];
      redoStackRef.current = [];
      setCanUndo(false);
      setCanRedo(false);

      setEaRepositoryUnsafe(res.repo);
      setMetadata(freezeMetadata(res.metadata));
      return { ok: true } as const;
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Invalid JSON.' } as const;
    }
  }, [setEaRepository]);

  const createNewRepository = React.useCallback((input: Omit<EaRepositoryMetadata, 'createdAt'>) => {
    const createdAt = new Date().toISOString();
    const metaRes = validateRepositoryMetadata({ ...input, createdAt });
    if (!metaRes.ok) return metaRes;

    // Important: do not create any EA elements automatically.

    // New repo is a new history root.
    undoStackRef.current = [];
    redoStackRef.current = [];
    setCanUndo(false);
    setCanRedo(false);

    setEaRepositoryUnsafe(new EaRepository());
    setMetadata(freezeMetadata(metaRes.metadata));
    return { ok: true } as const;
  }, []);

  const clearRepository = React.useCallback(() => {
    // Clearing is a new history root.
    undoStackRef.current = [];
    redoStackRef.current = [];
    setCanUndo(false);
    setCanRedo(false);

    setEaRepositoryUnsafe(null);
    setMetadata(null);
  }, []);

  const applySerialized = React.useCallback((raw: string): boolean => {
    try {
      const parsed = JSON.parse(raw) as SerializedRepository;
      const res = tryDeserializeRepository(parsed);
      if (!res.ok) return false;
      suppressHistoryRef.current = true;
      setEaRepositoryUnsafe(res.repo);
      setMetadata(freezeMetadata(res.metadata));
      return true;
    } catch {
      return false;
    }
  }, [setEaRepositoryUnsafe]);

  const undo = React.useCallback((): boolean => {
    const prevRaw = undoStackRef.current.pop();
    if (!prevRaw) {
      setCanUndo(false);
      return false;
    }

    const currentRaw = lastSerializedRef.current;
    if (currentRaw) {
      redoStackRef.current.unshift(currentRaw);
      if (redoStackRef.current.length > HISTORY_LIMIT) redoStackRef.current.pop();
    }

    const ok = applySerialized(prevRaw);
    if (!ok) return false;

    lastSerializedRef.current = prevRaw;
    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(redoStackRef.current.length > 0);
    return true;
  }, [applySerialized]);

  const redo = React.useCallback((): boolean => {
    const nextRaw = redoStackRef.current.shift();
    if (!nextRaw) {
      setCanRedo(false);
      return false;
    }

    const currentRaw = lastSerializedRef.current;
    if (currentRaw) {
      undoStackRef.current.push(currentRaw);
      if (undoStackRef.current.length > HISTORY_LIMIT) undoStackRef.current.shift();
    }

    const ok = applySerialized(nextRaw);
    if (!ok) return false;

    lastSerializedRef.current = nextRaw;
    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(redoStackRef.current.length > 0);
    return true;
  }, [applySerialized]);

  React.useEffect(() => {
    if (loading) return;

    try {
      // Persist only when repository *and* metadata exist.
      if (!eaRepository || !metadata) {
        localStorage.removeItem(STORAGE_KEY);
        lastSerializedRef.current = null;
        return;
      }

      const nextSerialized = JSON.stringify(serializeRepository(eaRepository, metadata));

      // Track history (repo-level undo/redo) for meaningful changes.
      if (!suppressHistoryRef.current) {
        const prevSerialized = lastSerializedRef.current;
        if (prevSerialized && prevSerialized !== nextSerialized) {
          undoStackRef.current.push(prevSerialized);
          if (undoStackRef.current.length > HISTORY_LIMIT) undoStackRef.current.shift();
          redoStackRef.current = [];
          setCanUndo(true);
          setCanRedo(false);
        }
      }

      suppressHistoryRef.current = false;
      lastSerializedRef.current = nextSerialized;

      if (metadata.governanceMode === 'Strict' || metadata.governanceMode === 'Advisory') {
        const debt = buildGovernanceDebt(eaRepository, new Date(), { lifecycleCoverage: metadata.lifecycleCoverage });
        const {
          mandatoryFindingCount,
          invalidRelationshipInsertCount,
          relationshipErrorCount,
          lifecycleTagMissingCount,
          total,
        } = debt.summary;
        const key = `${mandatoryFindingCount}|${invalidRelationshipInsertCount}|${relationshipErrorCount}|${debt.summary.relationshipWarningCount}|${lifecycleTagMissingCount}`;

        const highlights = () => {
          const items: string[] = [];
          for (const f of debt.repoReport.findings.slice(0, 3)) items.push(`Mandatory: ${f.message} (${f.elementId})`);
          for (const f of debt.relationshipReport.findings.slice(0, 3)) items.push(`Relationship: ${f.message} (${f.subjectId})`);
          for (const s of debt.invalidRelationshipInserts.slice(0, 3)) items.push(`Relationship insert: ${s}`);
          for (const id of debt.lifecycleTagMissingIds.slice(0, 3)) items.push(`Lifecycle tag missing: ${id}`);
          return items;
        };

        if (metadata.governanceMode === 'Strict') {
          const blocked =
            mandatoryFindingCount > 0 ||
            relationshipErrorCount > 0 ||
            invalidRelationshipInsertCount > 0 ||
            lifecycleTagMissingCount > 0;
          if (blocked) {
            if (lastSaveBlockedKeyRef.current !== key) {
              lastSaveBlockedKeyRef.current = key;

              appendGovernanceLog({
                type: 'save.blocked',
                governanceMode: 'Strict',
                repositoryName: metadata.repositoryName,
                architectureScope: metadata.architectureScope ?? undefined,
                summary: debt.summary,
                highlights: highlights(),
              });

              // Ensure only a single blocking dialog is shown.
              if (saveBlockedModalRef.current) {
                saveBlockedModalRef.current.destroy();
                saveBlockedModalRef.current = null;
              }

              saveBlockedModalRef.current = Modal.error({
                title: 'Save blocked by governance (Strict mode)',
                content: (
                  <div>
                    <div>Fix these issues to enable saving:</div>
                    <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 18 }}>
                      <li>
                        Mandatory attribute findings: <strong>{mandatoryFindingCount}</strong>
                      </li>
                      <li>
                        Missing lifecycle tags (Both mode): <strong>{lifecycleTagMissingCount}</strong>
                      </li>
                      <li>
                        Invalid relationships: <strong>{invalidRelationshipInsertCount}</strong>
                      </li>
                      <li>
                        Relationship errors: <strong>{relationshipErrorCount}</strong>
                      </li>
                    </ul>
                  </div>
                ),
                okText: 'OK',
                onOk: () => {
                  saveBlockedModalRef.current = null;
                },
              });
            }
            return;
          }

          if (lastSaveBlockedKeyRef.current) {
            lastSaveBlockedKeyRef.current = null;
            if (saveBlockedModalRef.current) {
              saveBlockedModalRef.current.destroy();
              saveBlockedModalRef.current = null;
            }
            message.success('Governance compliant: saving re-enabled.');
          }
        }

        if (metadata.governanceMode === 'Advisory') {
          // Warn, don’t stop: allow save but surface debt (non-blocking).
          if (total > 0 && lastAdvisoryWarnKeyRef.current !== key) {
            lastAdvisoryWarnKeyRef.current = key;
            message.warning(`Saved with governance warnings (Advisory): ${total} issue(s).`);

            appendGovernanceLog({
              type: 'save.warned',
              governanceMode: 'Advisory',
              repositoryName: metadata.repositoryName,
              architectureScope: metadata.architectureScope ?? undefined,
              summary: debt.summary,
              highlights: highlights(),
            });
          }
          if (total === 0) {
            lastAdvisoryWarnKeyRef.current = null;
          }
        }
      }

      localStorage.setItem(STORAGE_KEY, nextSerialized);
    } catch {
      // Ignore persistence errors (e.g., storage quota).
    }
  }, [eaRepository, loading, metadata]);

  return (
    <EaRepositoryContext.Provider
      value={{
        eaRepository,
        metadata,
        loading,
        setEaRepository,
        createNewRepository,
        loadRepositoryFromJsonText,
        clearRepository,

        canUndo,
        canRedo,
        undo,
        redo,
      }}
    >
      {children}
    </EaRepositoryContext.Provider>
  );
};

export function useEaRepository(): EaRepositoryContextValue {
  const ctx = React.useContext(EaRepositoryContext);
  if (!ctx) throw new Error('useEaRepository must be used within EaRepositoryProvider');
  return ctx;
}
