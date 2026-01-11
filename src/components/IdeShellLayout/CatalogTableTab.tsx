import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Space, Typography } from 'antd';
import React from 'react';
import styles from './style.module.less';
import type { BaseArchitectureElement } from '../../../backend/repository/BaseArchitectureElement';
import type { Application } from '../../../backend/repository/Application';
import type { BusinessProcess } from '../../../backend/repository/BusinessProcess';
import type { Capability } from '../../../backend/repository/Capability';
import type { Programme } from '../../../backend/repository/Programme';
import type { Technology } from '../../../backend/repository/Technology';
import {
  getRepositoryApplications,
  getRepositoryCapabilities,
  getRepositoryProcesses,
  getRepositoryProgrammes,
  getRepositoryTechnologies,
} from '@/services/ea/repository';

export type CatalogKind =
  | 'capabilities'
  | 'processes'
  | 'applications'
  | 'technologies'
  | 'programmes';

export const titleForCatalogKind = (kind: CatalogKind) => {
  switch (kind) {
    case 'capabilities':
      return 'Capabilities';
    case 'processes':
      return 'Business Processes';
    case 'applications':
      return 'Applications';
    case 'technologies':
      return 'Technologies';
    case 'programmes':
      return 'Programmes';
    default:
      return 'Catalog';
  }
};

const baseColumns: ProColumns<any>[] = [
  { title: 'ID', dataIndex: 'id', width: 240 },
  { title: 'Name', dataIndex: 'name', width: 220 },
  { title: 'Description', dataIndex: 'description', ellipsis: true, width: 320 },
  { title: 'Element Type', dataIndex: 'elementType', width: 140 },
  { title: 'Layer', dataIndex: 'layer', width: 140 },
  { title: 'Lifecycle Status', dataIndex: 'lifecycleStatus', width: 160 },
  { title: 'Lifecycle Start', dataIndex: 'lifecycleStartDate', width: 150 },
  { title: 'Lifecycle End', dataIndex: 'lifecycleEndDate', width: 150 },
  { title: 'Owner Role', dataIndex: 'ownerRole', width: 160 },
  { title: 'Owner Name', dataIndex: 'ownerName', width: 180 },
  { title: 'Owning Unit', dataIndex: 'owningUnit', width: 180 },
  { title: 'Approval Status', dataIndex: 'approvalStatus', width: 160 },
  { title: 'Last Reviewed At', dataIndex: 'lastReviewedAt', width: 180 },
  { title: 'Review Cycle (Months)', dataIndex: 'reviewCycleMonths', width: 190 },
  { title: 'Created At', dataIndex: 'createdAt', width: 180 },
  { title: 'Created By', dataIndex: 'createdBy', width: 160 },
  { title: 'Last Modified At', dataIndex: 'lastModifiedAt', width: 180 },
  { title: 'Last Modified By', dataIndex: 'lastModifiedBy', width: 170 },
];

const capabilityColumns: ProColumns<any>[] = [
  ...baseColumns,
  { title: 'Capability Level', dataIndex: 'capabilityLevel', width: 150 },
  { title: 'Parent Capability ID', dataIndex: 'parentCapabilityId', width: 240 },
  { title: 'Business Outcome', dataIndex: 'businessOutcome', width: 260, ellipsis: true },
  { title: 'Value Stream', dataIndex: 'valueStream', width: 200 },
  { title: 'In Scope', dataIndex: 'inScope', width: 110, valueType: 'switch' },
  { title: 'Impacted By Change', dataIndex: 'impactedByChange', width: 170, valueType: 'switch' },
  { title: 'Strategic Importance', dataIndex: 'strategicImportance', width: 170 },
  { title: 'Maturity Level', dataIndex: 'maturityLevel', width: 140 },
];

const processColumns: ProColumns<any>[] = [
  ...baseColumns,
  { title: 'Process Owner', dataIndex: 'processOwner', width: 200 },
  { title: 'Triggering Event', dataIndex: 'triggeringEvent', width: 220, ellipsis: true },
  { title: 'Expected Outcome', dataIndex: 'expectedOutcome', width: 240, ellipsis: true },
  { title: 'Frequency', dataIndex: 'frequency', width: 140 },
  { title: 'Criticality', dataIndex: 'criticality', width: 140 },
  { title: 'Regulatory Relevant', dataIndex: 'regulatoryRelevant', width: 170, valueType: 'switch' },
  { title: 'Compliance Notes', dataIndex: 'complianceNotes', width: 260, ellipsis: true },
  { title: 'Parent Capability ID', dataIndex: 'parentCapabilityId', width: 240 },
];

const applicationColumns: ProColumns<any>[] = [
  ...baseColumns,
  { title: 'Application Code', dataIndex: 'applicationCode', width: 180 },
  { title: 'Application Type', dataIndex: 'applicationType', width: 150 },
  { title: 'Business Criticality', dataIndex: 'businessCriticality', width: 180 },
  { title: 'Availability Target (%)', dataIndex: 'availabilityTarget', width: 190 },
  { title: 'Deployment Model', dataIndex: 'deploymentModel', width: 150 },
  { title: 'Vendor Lock-In Risk', dataIndex: 'vendorLockInRisk', width: 170 },
  { title: 'Technical Debt Level', dataIndex: 'technicalDebtLevel', width: 180 },
  { title: 'Annual Run Cost', dataIndex: 'annualRunCost', width: 160 },
  { title: 'Vendor Name', dataIndex: 'vendorName', width: 200 },
];

const technologyColumns: ProColumns<any>[] = [
  ...baseColumns,
  { title: 'Technology Type', dataIndex: 'technologyType', width: 160 },
  { title: 'Technology Category', dataIndex: 'technologyCategory', width: 190 },
  { title: 'Vendor', dataIndex: 'vendor', width: 180 },
  { title: 'Version', dataIndex: 'version', width: 140 },
  { title: 'Support End Date', dataIndex: 'supportEndDate', width: 170 },
  { title: 'Obsolescence Risk', dataIndex: 'obsolescenceRisk', width: 170 },
  { title: 'Standard Approved', dataIndex: 'standardApproved', width: 170, valueType: 'switch' },
];

const programmeColumns: ProColumns<any>[] = [
  ...baseColumns,
  { title: 'Programme Type', dataIndex: 'programmeType', width: 160 },
  { title: 'Strategic Objective', dataIndex: 'strategicObjective', width: 260, ellipsis: true },
  { title: 'Start Date', dataIndex: 'startDate', width: 150 },
  { title: 'End Date', dataIndex: 'endDate', width: 150 },
  { title: 'Budget Estimate', dataIndex: 'budgetEstimate', width: 160 },
  { title: 'Funding Status', dataIndex: 'fundingStatus', width: 150 },
  { title: 'Expected Business Impact', dataIndex: 'expectedBusinessImpact', width: 280, ellipsis: true },
  { title: 'Risk Level', dataIndex: 'riskLevel', width: 130 },
];

const CatalogTableTab: React.FC<{ kind: CatalogKind }> = ({ kind }) => {
  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<unknown[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        if (kind === 'capabilities') {
          const res = await getRepositoryCapabilities();
          if (!cancelled) setRows(Array.isArray(res?.data) ? res.data : []);
          return;
        }
        if (kind === 'processes') {
          const res = await getRepositoryProcesses();
          if (!cancelled) setRows(Array.isArray(res?.data) ? res.data : []);
          return;
        }
        if (kind === 'applications') {
          const res = await getRepositoryApplications();
          if (!cancelled) setRows(Array.isArray(res?.data) ? res.data : []);
          return;
        }
        if (kind === 'technologies') {
          const res = await getRepositoryTechnologies();
          if (!cancelled) setRows(Array.isArray(res?.data) ? res.data : []);
          return;
        }
        if (kind === 'programmes') {
          const res = await getRepositoryProgrammes();
          if (!cancelled) setRows(Array.isArray(res?.data) ? res.data : []);
          return;
        }
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [kind]);

  const columns = React.useMemo(() => {
    if (kind === 'capabilities') return capabilityColumns as ProColumns<any>[];
    if (kind === 'processes') return processColumns as ProColumns<any>[];
    if (kind === 'applications') return applicationColumns as ProColumns<any>[];
    if (kind === 'technologies') return technologyColumns as ProColumns<any>[];
    if (kind === 'programmes') return programmeColumns as ProColumns<any>[];
    return baseColumns as ProColumns<any>[];
  }, [kind]);

  return (
    <div className={styles.catalogTab}>
      <ProTable
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={rows as any[]}
        loading={loading}
        search={false}
        options={false}
        pagination={false}
        scroll={{ x: 'max-content' }}
        headerTitle={
          <Space size={8}>
            <Typography.Text strong>{titleForCatalogKind(kind)}</Typography.Text>
            <Typography.Text type="secondary">{rows.length} items</Typography.Text>
          </Space>
        }
      />
    </div>
  );
};

export default CatalogTableTab;
