export const OBJECT_TYPES = [
  'CapabilityCategory',
  'Capability',
  'SubCapability',
  'BusinessProcess',
  'Department',
  'Application',
  'Technology',
  'Programme',
  'Project',
  'Principle',
  'Requirement',
] as const;

export type ObjectType = (typeof OBJECT_TYPES)[number];

export const RELATIONSHIP_TYPES = [
  'DECOMPOSES_TO',
  'REALIZES',
  'DEPENDS_ON',
  'HOSTED_ON',
  'SUPPORTS',
  'DELIVERS',
  'OWNS',
] as const;

export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export type EaLayer = 'Strategy' | 'Business' | 'Application' | 'Technology';

export type EaObjectTypeDefinition = {
  type: ObjectType;
  layer: EaLayer;
  description: string;
  attributes: readonly string[];
  allowedOutgoingRelationships: readonly RelationshipType[];
  allowedIncomingRelationships: readonly RelationshipType[];
};

export type EaRelationshipTypeDefinition = {
  type: RelationshipType;
  layer: EaLayer;
  description: string;
  fromTypes: readonly ObjectType[];
  toTypes: readonly ObjectType[];
  attributes: readonly string[];
};

export const EA_LAYERS: readonly EaLayer[] = ['Strategy', 'Business', 'Application', 'Technology'] as const;

export const OBJECT_TYPE_DEFINITIONS: Record<ObjectType, EaObjectTypeDefinition> = {
  Programme: {
    type: 'Programme',
    layer: 'Strategy',
    description: 'A strategic initiative grouping related change outcomes and delivery work.',
    attributes: ['name'],
    allowedOutgoingRelationships: ['DELIVERS'],
    allowedIncomingRelationships: [],
  },
  Project: {
    type: 'Project',
    layer: 'Strategy',
    description: 'A time-bound delivery effort (v1: catalogued but not fully modeled).',
    attributes: ['name'],
    allowedOutgoingRelationships: [],
    allowedIncomingRelationships: [],
  },
  Principle: {
    type: 'Principle',
    layer: 'Strategy',
    description: 'A guiding principle that shapes architecture decisions.',
    attributes: ['name'],
    allowedOutgoingRelationships: [],
    allowedIncomingRelationships: [],
  },
  Requirement: {
    type: 'Requirement',
    layer: 'Strategy',
    description: 'A requirement that constrains or informs architecture and change work.',
    attributes: ['name'],
    allowedOutgoingRelationships: [],
    allowedIncomingRelationships: [],
  },
  CapabilityCategory: {
    type: 'CapabilityCategory',
    layer: 'Business',
    description: 'A top-level grouping of business capabilities.',
    attributes: ['name', 'category'],
    allowedOutgoingRelationships: ['DECOMPOSES_TO'],
    allowedIncomingRelationships: ['DECOMPOSES_TO', 'DELIVERS'],
  },
  Capability: {
    type: 'Capability',
    layer: 'Business',
    description: 'A business capability (what the business does).',
    attributes: ['name', 'category'],
    allowedOutgoingRelationships: ['DECOMPOSES_TO'],
    allowedIncomingRelationships: ['DECOMPOSES_TO', 'DELIVERS'],
  },
  SubCapability: {
    type: 'SubCapability',
    layer: 'Business',
    description: 'A decomposed business capability (more granular capability).',
    attributes: ['name', 'category'],
    allowedOutgoingRelationships: [],
    allowedIncomingRelationships: ['DECOMPOSES_TO', 'DELIVERS'],
  },
  BusinessProcess: {
    type: 'BusinessProcess',
    layer: 'Business',
    description: 'A business process (how work is performed across steps/activities).',
    attributes: ['name'],
    allowedOutgoingRelationships: ['REALIZES'],
    allowedIncomingRelationships: ['SUPPORTS'],
  },
  Department: {
    type: 'Department',
    layer: 'Business',
    description: 'An organizational unit accountable for or owning applications (v1: simple catalogued unit).',
    attributes: ['name'],
    allowedOutgoingRelationships: ['OWNS'],
    allowedIncomingRelationships: [],
  },
  Application: {
    type: 'Application',
    layer: 'Application',
    description: 'A software application or service.',
    attributes: ['name', 'criticality', 'lifecycle'],
    allowedOutgoingRelationships: ['DEPENDS_ON', 'HOSTED_ON', 'SUPPORTS'],
    allowedIncomingRelationships: ['DEPENDS_ON', 'REALIZES', 'DELIVERS', 'OWNS'],
  },
  Technology: {
    type: 'Technology',
    layer: 'Technology',
    description: 'A technology platform/component that applications run on or use.',
    attributes: ['name'],
    allowedOutgoingRelationships: [],
    allowedIncomingRelationships: ['HOSTED_ON'],
  },
} as const;

export const RELATIONSHIP_TYPE_DEFINITIONS: Record<RelationshipType, EaRelationshipTypeDefinition> = {
  DECOMPOSES_TO: {
    type: 'DECOMPOSES_TO',
    layer: 'Business',
    description: 'Decomposition relationship used to break a parent element into child elements.',
    fromTypes: ['CapabilityCategory', 'Capability', 'SubCapability'],
    toTypes: ['CapabilityCategory', 'Capability', 'SubCapability'],
    attributes: [],
  },
  REALIZES: {
    type: 'REALIZES',
    layer: 'Business',
    description: 'Indicates an application realizes (implements/enables) a business process.',
    fromTypes: ['BusinessProcess'],
    toTypes: ['Application'],
    attributes: [],
  },
  DEPENDS_ON: {
    type: 'DEPENDS_ON',
    layer: 'Application',
    description: 'Dependency relationship between applications (service/application calling another).',
    fromTypes: ['Application'],
    toTypes: ['Application'],
    attributes: ['dependencyStrength', 'dependencyType'],
  },
  HOSTED_ON: {
    type: 'HOSTED_ON',
    layer: 'Technology',
    description: 'Hosting relationship (application hosted on / deployed to technology).',
    fromTypes: ['Application'],
    toTypes: ['Technology'],
    attributes: [],
  },
  SUPPORTS: {
    type: 'SUPPORTS',
    layer: 'Business',
    description: 'Support relationship (application supports a business process).',
    fromTypes: ['Application'],
    toTypes: ['BusinessProcess'],
    attributes: [],
  },
  DELIVERS: {
    type: 'DELIVERS',
    layer: 'Strategy',
    description: 'Delivery relationship from a programme to a delivered business/application outcome.',
    fromTypes: ['Programme'],
    toTypes: ['CapabilityCategory', 'Capability', 'SubCapability', 'Application'],
    attributes: [],
  },
  OWNS: {
    type: 'OWNS',
    layer: 'Business',
    description: 'Ownership/accountability relationship from an organizational unit to an application.',
    fromTypes: ['Department'],
    toTypes: ['Application'],
    attributes: ['sourceFile', 'sourceRow', 'importedAt'],
  },
} as const;

export function isValidObjectType(type: unknown): type is ObjectType {
  return typeof type === 'string' && (OBJECT_TYPES as readonly string[]).includes(type);
}

export function isValidRelationshipType(type: unknown): type is RelationshipType {
  return typeof type === 'string' && (RELATIONSHIP_TYPES as readonly string[]).includes(type);
}
