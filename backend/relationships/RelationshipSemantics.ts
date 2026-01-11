export type RelationshipEndpointRule = {
  from: readonly string[];
  to: readonly string[];
};

/**
 * Canonical relationship endpoint semantics.
 *
 * This is shared by:
 * - Relationship storage validation (safe writes)
 * - View definition validation (safe projections)
 * - View template instantiation (deterministic defaults)
 */
export const RELATIONSHIP_ENDPOINT_RULES: Readonly<Record<string, RelationshipEndpointRule>> = {
  // Business architecture traceability
  DECOMPOSES_TO: { from: ['Capability'], to: ['BusinessProcess'] },

  // Business-to-application alignment
  REALIZED_BY: { from: ['BusinessProcess'], to: ['Application'] },

  // Application dependency / impact analysis
  DEPENDS_ON: { from: ['Application'], to: ['Application'] },

  // Application-to-infrastructure traceability
  HOSTED_ON: { from: ['Application'], to: ['Technology'] },

  // Strategy-to-execution linkage
  IMPACTS: { from: ['Programme'], to: ['Capability', 'Application', 'Technology'] },
} as const;

export function getRelationshipEndpointRule(type: string): RelationshipEndpointRule | null {
  const key = (type ?? '').trim();
  return RELATIONSHIP_ENDPOINT_RULES[key] ?? null;
}

export function isKnownRelationshipType(type: string): boolean {
  return Boolean(getRelationshipEndpointRule(type));
}
