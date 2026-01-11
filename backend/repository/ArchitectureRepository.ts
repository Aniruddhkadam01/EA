import type { Application } from './Application';
import type { BaseArchitectureElement } from './BaseArchitectureElement';
import type { BusinessProcess } from './BusinessProcess';
import type { Capability } from './Capability';
import type { Programme } from './Programme';
import type { Technology } from './Technology';

export type RepositoryCollectionType =
  | 'capabilities'
  | 'businessProcesses'
  | 'applications'
  | 'technologies'
  | 'programmes';

type ElementByCollection = {
  capabilities: Capability;
  businessProcesses: BusinessProcess;
  applications: Application;
  technologies: Technology;
  programmes: Programme;
};

type RepositoryResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

const expectedElementType: Record<RepositoryCollectionType, BaseArchitectureElement['elementType']> = {
  capabilities: 'Capability',
  businessProcesses: 'BusinessProcess',
  applications: 'Application',
  technologies: 'Technology',
  programmes: 'Programme',
};

const isCapability = (e: BaseArchitectureElement): e is Capability => e.elementType === 'Capability';
const isBusinessProcess = (e: BaseArchitectureElement): e is BusinessProcess => e.elementType === 'BusinessProcess';
const isApplication = (e: BaseArchitectureElement): e is Application => e.elementType === 'Application';
const isTechnology = (e: BaseArchitectureElement): e is Technology => e.elementType === 'Technology';
const isProgramme = (e: BaseArchitectureElement): e is Programme => e.elementType === 'Programme';

/**
 * In-memory Enterprise Architecture repository core.
 *
 * Responsibilities:
 * - Store elements by collection.
 * - Enforce unique IDs across all collections.
 * - Enforce correct elementType per collection.
 *
 * Non-responsibilities:
 * - No relationships.
 * - No persistence.
 * - No APIs.
 */
export class ArchitectureRepository {
  private readonly byId = new Map<string, BaseArchitectureElement>();

  private readonly capabilities = new Map<string, Capability>();
  private readonly businessProcesses = new Map<string, BusinessProcess>();
  private readonly applications = new Map<string, Application>();
  private readonly technologies = new Map<string, Technology>();
  private readonly programmes = new Map<string, Programme>();

  addElement(type: 'capabilities', element: Capability): RepositoryResult<void>;
  addElement(type: 'businessProcesses', element: BusinessProcess): RepositoryResult<void>;
  addElement(type: 'applications', element: Application): RepositoryResult<void>;
  addElement(type: 'technologies', element: Technology): RepositoryResult<void>;
  addElement(type: 'programmes', element: Programme): RepositoryResult<void>;
  addElement(type: RepositoryCollectionType, element: BaseArchitectureElement): RepositoryResult<void>;
  addElement(type: RepositoryCollectionType, element: BaseArchitectureElement): RepositoryResult<void> {
    if (this.byId.has(element.id)) {
      return { ok: false, error: `Duplicate id: ${element.id}` };
    }

    const expected = expectedElementType[type];
    if (element.elementType !== expected) {
      return {
        ok: false,
        error: `Rejected insert: elementType '${element.elementType}' does not match collection '${type}' (expected '${expected}').`,
      };
    }

    // Insert into the correct collection only.
    switch (type) {
      case 'capabilities':
        if (!isCapability(element)) {
          return { ok: false, error: 'Rejected insert: element is not a Capability.' };
        }
        this.capabilities.set(element.id, element);
        break;
      case 'businessProcesses':
        if (!isBusinessProcess(element)) {
          return { ok: false, error: 'Rejected insert: element is not a BusinessProcess.' };
        }
        this.businessProcesses.set(element.id, element);
        break;
      case 'applications':
        if (!isApplication(element)) {
          return { ok: false, error: 'Rejected insert: element is not an Application.' };
        }
        this.applications.set(element.id, element);
        break;
      case 'technologies':
        if (!isTechnology(element)) {
          return { ok: false, error: 'Rejected insert: element is not a Technology.' };
        }
        this.technologies.set(element.id, element);
        break;
      case 'programmes':
        if (!isProgramme(element)) {
          return { ok: false, error: 'Rejected insert: element is not a Programme.' };
        }
        this.programmes.set(element.id, element);
        break;
      default: {
        const _exhaustive: never = type;
        return { ok: false, error: `Unsupported collection type: ${String(_exhaustive)}` };
      }
    }

    this.byId.set(element.id, element);
    return { ok: true, value: undefined };
  }

  getElementsByType(type: 'capabilities'): Capability[];
  getElementsByType(type: 'businessProcesses'): BusinessProcess[];
  getElementsByType(type: 'applications'): Application[];
  getElementsByType(type: 'technologies'): Technology[];
  getElementsByType(type: 'programmes'): Programme[];
  getElementsByType(type: RepositoryCollectionType): BaseArchitectureElement[];
  getElementsByType(type: RepositoryCollectionType): BaseArchitectureElement[] {
    switch (type) {
      case 'capabilities':
        return Array.from(this.capabilities.values());
      case 'businessProcesses':
        return Array.from(this.businessProcesses.values());
      case 'applications':
        return Array.from(this.applications.values());
      case 'technologies':
        return Array.from(this.technologies.values());
      case 'programmes':
        return Array.from(this.programmes.values());
      default: {
        const _exhaustive: never = type;
        return [];
      }
    }
  }

  getElementById(id: string): BaseArchitectureElement | null {
    return this.byId.get(id) ?? null;
  }
}

export function createArchitectureRepository(): ArchitectureRepository {
  return new ArchitectureRepository();
}
