import { EaRepository } from '@/pages/dependency-view/utils/eaRepository';

import { validateArchitectureRepository } from '../../backend/analysis/RepositoryValidation';
import { validateRelationshipRepository } from '../../backend/analysis/RelationshipValidation';
import { ArchitectureRepository } from '../../backend/repository/ArchitectureRepository';
import { createRelationshipRepository } from '../../backend/repository/RelationshipRepository';

import type { LifecycleCoverage } from '@/repository/repositoryMetadata';
import { getLifecycleStateFromAttributes } from '@/repository/lifecycleCoveragePolicy';

export type GovernanceDebtSummary = {
  mandatoryFindingCount: number;
  relationshipErrorCount: number;
  relationshipWarningCount: number;
  invalidRelationshipInsertCount: number;
  lifecycleTagMissingCount: number;
  total: number;
};

export type GovernanceDebt = {
  summary: GovernanceDebtSummary;
  repoReport: ReturnType<typeof validateArchitectureRepository>;
  relationshipReport: ReturnType<typeof validateRelationshipRepository>;
  invalidRelationshipInserts: string[];
  lifecycleTagMissingIds: string[];
};

const getString = (value: unknown): string => (typeof value === 'string' ? value : '');
const getNumber = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) ? value : 0);
const getBool = (value: unknown): boolean => value === true;

const toBackendElementType = (eaType: string): string => {
  if (eaType === 'Capability' || eaType === 'SubCapability' || eaType === 'CapabilityCategory') return 'Capability';
  if (eaType === 'BusinessProcess') return 'BusinessProcess';
  if (eaType === 'Application') return 'Application';
  if (eaType === 'Technology') return 'Technology';
  if (eaType === 'Programme') return 'Programme';
  return eaType;
};

export function buildGovernanceDebt(
  eaRepository: EaRepository,
  nowDate: Date = new Date(),
  options?: { lifecycleCoverage?: LifecycleCoverage | null },
): GovernanceDebt {
  const repo = new ArchitectureRepository();
  const now = nowDate.toISOString();

  const lifecycleCoverage = options?.lifecycleCoverage ?? null;
  const lifecycleTagMissingIds: string[] = [];

  for (const obj of eaRepository.objects.values()) {
    const attrs = obj.attributes ?? {};

    if (lifecycleCoverage === 'Both' && attrs._deleted !== true) {
      const state = getLifecycleStateFromAttributes(attrs);
      if (!state) lifecycleTagMissingIds.push(obj.id);
    }

    const name = typeof attrs.name === 'string' && attrs.name.trim() ? attrs.name.trim() : obj.id;

    if (obj.type === 'Capability' || obj.type === 'CapabilityCategory' || obj.type === 'SubCapability') {
      repo.addElement('capabilities', {
        id: obj.id,
        name,
        description: getString(attrs.description),
        elementType: 'Capability',
        layer: 'Business',
        lifecycleStatus: (attrs.lifecycleStatus as any) || 'Active',
        lifecycleStartDate: getString(attrs.lifecycleStartDate),
        lifecycleEndDate: getString(attrs.lifecycleEndDate) || undefined,
        ownerRole: getString(attrs.ownerRole),
        ownerName: getString(attrs.ownerName),
        owningUnit: getString(attrs.owningUnit),
        approvalStatus: (attrs.approvalStatus as any) || 'Draft',
        lastReviewedAt: getString(attrs.lastReviewedAt),
        reviewCycleMonths: getNumber(attrs.reviewCycleMonths),
        createdAt: getString(attrs.createdAt) || now,
        createdBy: getString(attrs.createdBy),
        lastModifiedAt: getString(attrs.lastModifiedAt) || now,
        lastModifiedBy: getString(attrs.lastModifiedBy),

        capabilityType: (attrs.capabilityType as any) || 'Core',
        businessValue: (attrs.businessValue as any) || 'Medium',
        maturityLevel: (attrs.maturityLevel as any) || 'Developing',
        parentCapabilityId: getString(attrs.parentCapabilityId),
      } as any);
      continue;
    }

    if (obj.type === 'Application') {
      repo.addElement('applications', {
        id: obj.id,
        name,
        description: getString(attrs.description),
        elementType: 'Application',
        layer: 'Application',
        lifecycleStatus: (attrs.lifecycleStatus as any) || 'Active',
        lifecycleStartDate: getString(attrs.lifecycleStartDate),
        lifecycleEndDate: getString(attrs.lifecycleEndDate) || undefined,
        ownerRole: getString(attrs.ownerRole),
        ownerName: getString(attrs.ownerName),
        owningUnit: getString(attrs.owningUnit),
        approvalStatus: (attrs.approvalStatus as any) || 'Draft',
        lastReviewedAt: getString(attrs.lastReviewedAt),
        reviewCycleMonths: getNumber(attrs.reviewCycleMonths),
        createdAt: getString(attrs.createdAt) || now,
        createdBy: getString(attrs.createdBy),
        lastModifiedAt: getString(attrs.lastModifiedAt) || now,
        lastModifiedBy: getString(attrs.lastModifiedBy),

        applicationType: (attrs.applicationType as any) || 'Custom',
        vendor: getString(attrs.vendor),
        version: getString(attrs.version),
        hostingModel: (attrs.hostingModel as any) || 'OnPrem',
        technologyStack: Array.isArray(attrs.technologyStack) ? attrs.technologyStack : [],
        userCountEstimate: getNumber(attrs.userCountEstimate),
        criticality: (attrs.criticality as any) || 'Medium',
        dataClassification: (attrs.dataClassification as any) || 'Internal',
        integrations: Array.isArray(attrs.integrations) ? attrs.integrations : [],
      } as any);
      continue;
    }

    if (obj.type === 'Technology') {
      repo.addElement('technologies', {
        id: obj.id,
        name,
        description: getString(attrs.description),
        elementType: 'Technology',
        layer: 'Technology',
        lifecycleStatus: (attrs.lifecycleStatus as any) || 'Active',
        lifecycleStartDate: getString(attrs.lifecycleStartDate),
        lifecycleEndDate: getString(attrs.lifecycleEndDate) || undefined,
        ownerRole: getString(attrs.ownerRole),
        ownerName: getString(attrs.ownerName),
        owningUnit: getString(attrs.owningUnit),
        approvalStatus: (attrs.approvalStatus as any) || 'Draft',
        lastReviewedAt: getString(attrs.lastReviewedAt),
        reviewCycleMonths: getNumber(attrs.reviewCycleMonths),
        createdAt: getString(attrs.createdAt) || now,
        createdBy: getString(attrs.createdBy),
        lastModifiedAt: getString(attrs.lastModifiedAt) || now,
        lastModifiedBy: getString(attrs.lastModifiedBy),

        technologyType: (attrs.technologyType as any) || 'Platform',
        vendor: getString(attrs.vendor),
        version: getString(attrs.version),
        category: getString(attrs.category),
        deploymentModel: (attrs.deploymentModel as any) || 'OnPrem',
        supportEndDate: getString(attrs.supportEndDate),
        standardApproved: getBool(attrs.standardApproved),
      } as any);
      continue;
    }

    if (obj.type === 'BusinessProcess') {
      repo.addElement('businessProcesses', {
        id: obj.id,
        name,
        description: getString(attrs.description),
        elementType: 'BusinessProcess',
        layer: 'Business',
        lifecycleStatus: (attrs.lifecycleStatus as any) || 'Active',
        lifecycleStartDate: getString(attrs.lifecycleStartDate),
        lifecycleEndDate: getString(attrs.lifecycleEndDate) || undefined,
        ownerRole: getString(attrs.ownerRole),
        ownerName: getString(attrs.ownerName),
        owningUnit: getString(attrs.owningUnit),
        approvalStatus: (attrs.approvalStatus as any) || 'Draft',
        lastReviewedAt: getString(attrs.lastReviewedAt),
        reviewCycleMonths: getNumber(attrs.reviewCycleMonths),
        createdAt: getString(attrs.createdAt) || now,
        createdBy: getString(attrs.createdBy),
        lastModifiedAt: getString(attrs.lastModifiedAt) || now,
        lastModifiedBy: getString(attrs.lastModifiedBy),

        processOwner: getString(attrs.processOwner),
        triggeringEvent: getString(attrs.triggeringEvent),
        expectedOutcome: getString(attrs.expectedOutcome),
        frequency: (attrs.frequency as any) || 'Ad-hoc',
        criticality: (attrs.criticality as any) || 'Medium',
        regulatoryRelevant: getBool(attrs.regulatoryRelevant),
        complianceNotes: getString(attrs.complianceNotes),
        parentCapabilityId: getString(attrs.parentCapabilityId),
      } as any);
      continue;
    }

    if (obj.type === 'Programme') {
      repo.addElement('programmes', {
        id: obj.id,
        name,
        description: getString(attrs.description),
        elementType: 'Programme',
        layer: 'Strategy',
        lifecycleStatus: (attrs.lifecycleStatus as any) || 'Active',
        lifecycleStartDate: getString(attrs.lifecycleStartDate),
        lifecycleEndDate: getString(attrs.lifecycleEndDate) || undefined,
        ownerRole: getString(attrs.ownerRole),
        ownerName: getString(attrs.ownerName),
        owningUnit: getString(attrs.owningUnit),
        approvalStatus: (attrs.approvalStatus as any) || 'Draft',
        lastReviewedAt: getString(attrs.lastReviewedAt),
        reviewCycleMonths: getNumber(attrs.reviewCycleMonths),
        createdAt: getString(attrs.createdAt) || now,
        createdBy: getString(attrs.createdBy),
        lastModifiedAt: getString(attrs.lastModifiedAt) || now,
        lastModifiedBy: getString(attrs.lastModifiedBy),

        programmeType: (attrs.programmeType as any) || 'Transformation',
        strategicObjective: getString(attrs.strategicObjective),
        startDate: getString(attrs.startDate),
        endDate: getString(attrs.endDate),
        budgetEstimate: getNumber(attrs.budgetEstimate),
        fundingStatus: (attrs.fundingStatus as any) || 'Proposed',
        expectedBusinessImpact: getString(attrs.expectedBusinessImpact),
        riskLevel: (attrs.riskLevel as any) || 'Medium',
      } as any);
    }
  }

  const relationships = createRelationshipRepository(repo);
  const supportedElementIds = new Set<string>();
  for (const element of ([] as any[])
    .concat(repo.getElementsByType('capabilities'))
    .concat(repo.getElementsByType('businessProcesses'))
    .concat(repo.getElementsByType('applications'))
    .concat(repo.getElementsByType('technologies'))
    .concat(repo.getElementsByType('programmes'))) {
    if (element?.id) supportedElementIds.add(String(element.id));
  }

  const invalidRelationshipInserts: string[] = [];
  for (const [i, rel] of eaRepository.relationships.entries()) {
    const sourceId = String(rel.fromId ?? '').trim();
    const targetId = String(rel.toId ?? '').trim();
    if (!sourceId || !targetId) continue;
    if (!supportedElementIds.has(sourceId) || !supportedElementIds.has(targetId)) continue;

    const sourceType = toBackendElementType(eaRepository.objects.get(sourceId)?.type ?? '');
    const targetType = toBackendElementType(eaRepository.objects.get(targetId)?.type ?? '');

    const relationshipAny: any = {
      id: `rel_${i}`,
      relationshipType: String(rel.type ?? '').trim(),
      sourceElementId: sourceId,
      sourceElementType: String(sourceType ?? '').trim(),
      targetElementId: targetId,
      targetElementType: String(targetType ?? '').trim(),
      direction: 'OUTGOING',
      status: 'Draft',
      effectiveFrom: now,
      effectiveTo: undefined,
      rationale: '',
      confidenceLevel: 'Medium',
      lastReviewedAt: now,
      reviewedBy: 'ui',
      createdAt: now,
      createdBy: 'ui',
    };

    if (relationshipAny.relationshipType === 'DEPENDS_ON') {
      relationshipAny.dependencyStrength = (rel as any)?.attributes?.dependencyStrength;
    }

    const addRes = relationships.addRelationship(relationshipAny);
    if (!addRes.ok) {
      invalidRelationshipInserts.push(
        `${relationshipAny.relationshipType || '(unknown)'} ${sourceId} -> ${targetId}: ${addRes.error}`,
      );
    }
  }

  const repoReport = validateArchitectureRepository(repo, nowDate);
  const relationshipReport = validateRelationshipRepository(repo, relationships, nowDate);

  const mandatoryFindingCount = repoReport.summary.total ?? 0;
  const relationshipErrorCount = relationshipReport.summary.bySeverity.Error ?? 0;
  const relationshipWarningCount = relationshipReport.summary.bySeverity.Warning ?? 0;
  const invalidRelationshipInsertCount = invalidRelationshipInserts.length;
  const lifecycleTagMissingCount = lifecycleTagMissingIds.length;

  return {
    summary: {
      mandatoryFindingCount,
      relationshipErrorCount,
      relationshipWarningCount,
      invalidRelationshipInsertCount,
      lifecycleTagMissingCount,
      total:
        mandatoryFindingCount +
        relationshipErrorCount +
        relationshipWarningCount +
        invalidRelationshipInsertCount +
        lifecycleTagMissingCount,
    },
    repoReport,
    relationshipReport,
    invalidRelationshipInserts,
    lifecycleTagMissingIds,
  };
}
