import type { ArchitectureScope } from '@/repository/repositoryMetadata';
import {
  OBJECT_TYPE_DEFINITIONS,
  type ObjectType,
  isValidObjectType,
} from '@/pages/dependency-view/utils/eaMetaModel';

export type WritableLayer = 'Business' | 'Application';

export function isObjectTypeWritableForScope(
  architectureScope: ArchitectureScope | null | undefined,
  objectType: ObjectType,
): boolean {
  const layer = OBJECT_TYPE_DEFINITIONS[objectType]?.layer;

  if (architectureScope === 'Programme') {
    return objectType === 'Programme' || objectType === 'Project';
  }

  if (architectureScope === 'Business Unit') {
    return layer === 'Business' || layer === 'Application';
  }

  if (architectureScope === 'Domain') {
    return layer === 'Application' || layer === 'Technology';
  }

  return true;
}

export function isAnyObjectTypeWritableForScope(
  architectureScope: ArchitectureScope | null | undefined,
  objectType: string | null | undefined,
): boolean {
  if (!objectType) return false;
  if (!isValidObjectType(objectType)) return false;
  return isObjectTypeWritableForScope(architectureScope, objectType);
}

export function getReadOnlyReason(
  architectureScope: ArchitectureScope | null | undefined,
  objectType: string | null | undefined,
): string | null {
  if (!objectType || !isValidObjectType(objectType)) {
    if (architectureScope === 'Programme') return 'Read-only in Programme scope.';
    if (architectureScope === 'Business Unit') return 'Read-only in Business Unit scope.';
    if (architectureScope === 'Domain') return 'Read-only in Domain scope.';
    return null;
  }

  const layer = OBJECT_TYPE_DEFINITIONS[objectType]?.layer;

  if (architectureScope === 'Business Unit') {
    if (layer === 'Business' || layer === 'Application') return null;
    return 'Read-only in Business Unit scope: only Business + Application layers are editable.';
  }

  if (architectureScope === 'Domain') {
    if (layer === 'Application' || layer === 'Technology') return null;
    return 'Read-only in Domain scope: only Application + Technology layers are editable.';
  }

  if (architectureScope === 'Programme') {
    if (objectType === 'Programme' || objectType === 'Project') return null;
    return 'Read-only in Programme scope: only Programme + Project elements are editable.';
  }

  return null;
}
