import {
  ApartmentOutlined,
  AppstoreOutlined,
  CaretDownOutlined,
  CaretRightOutlined,
  CloudOutlined,
  FileTextOutlined,
  FolderOutlined,
  ForkOutlined,
  FundProjectionScreenOutlined,
  ProjectOutlined,
  SafetyOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Tree } from 'antd';
import type { DataNode } from 'antd/es/tree';
import React from 'react';
import { useIdeShell } from './index';
import styles from './style.module.less';
import { useIdeSelection } from '@/ide/IdeSelectionContext';

const ROOT_KEYS = {
  business: 'explorer:business',
  application: 'explorer:application',
  technology: 'explorer:technology',
  implMig: 'explorer:implementation-migration',
  governance: 'explorer:governance',
} as const;

const EXPLORER_TREE_DATA: DataNode[] = [
  {
    key: ROOT_KEYS.business,
    title: 'Business',
    icon: <FolderOutlined />,
    children: [
      { key: 'explorer:business:capabilities', title: 'Capabilities', icon: <ApartmentOutlined /> },
      { key: 'explorer:business:processes', title: 'Business Processes', icon: <ForkOutlined /> },
      { key: 'explorer:business:departments', title: 'Departments', icon: <TeamOutlined /> },
    ],
  },
  {
    key: ROOT_KEYS.application,
    title: 'Application',
    icon: <FolderOutlined />,
    children: [{ key: 'explorer:application:applications', title: 'Applications', icon: <AppstoreOutlined /> }],
  },
  {
    key: ROOT_KEYS.technology,
    title: 'Technology',
    icon: <FolderOutlined />,
    children: [{ key: 'explorer:technology:technologies', title: 'Technologies', icon: <CloudOutlined /> }],
  },
  {
    key: ROOT_KEYS.implMig,
    title: 'Implementation & Migration',
    icon: <FolderOutlined />,
    children: [
      { key: 'explorer:implmig:programmes', title: 'Programmes', icon: <ProjectOutlined /> },
      { key: 'explorer:implmig:projects', title: 'Projects', icon: <FundProjectionScreenOutlined /> },
    ],
  },
  {
    key: ROOT_KEYS.governance,
    title: 'Governance',
    icon: <FolderOutlined />,
    children: [
      { key: 'explorer:governance:principles', title: 'Principles', icon: <SafetyOutlined /> },
      { key: 'explorer:governance:requirements', title: 'Requirements', icon: <FileTextOutlined /> },
    ],
  },
];

const ExplorerTree: React.FC = () => {
  const { setSelection } = useIdeSelection();
  const { openRouteTab, openWorkspaceTab } = useIdeShell();

  const defaultExpandedKeys = React.useMemo(
    () => [ROOT_KEYS.business, ROOT_KEYS.application, ROOT_KEYS.technology, ROOT_KEYS.implMig, ROOT_KEYS.governance],
    [],
  );

  const openForKey = React.useCallback(
    (key: string) => {
      // Root nodes open the most common catalog / view for that domain.
      if (key === ROOT_KEYS.business) {
        openWorkspaceTab({ type: 'catalog', catalog: 'capabilities' });
        return;
      }
      if (key === ROOT_KEYS.application) {
        openWorkspaceTab({ type: 'catalog', catalog: 'applications' });
        return;
      }
      if (key === ROOT_KEYS.technology) {
        openWorkspaceTab({ type: 'catalog', catalog: 'technologies' });
        return;
      }
      if (key === ROOT_KEYS.implMig) {
        openWorkspaceTab({ type: 'catalog', catalog: 'programmes' });
        return;
      }
      if (key === ROOT_KEYS.governance) {
        openRouteTab('/governance');
        return;
      }

      // Second-level catalogs.
      if (key === 'explorer:business:capabilities') {
        openWorkspaceTab({ type: 'catalog', catalog: 'capabilities' });
        return;
      }
      if (key === 'explorer:business:processes') {
        openWorkspaceTab({ type: 'catalog', catalog: 'processes' });
        return;
      }
      if (key === 'explorer:application:applications') {
        openWorkspaceTab({ type: 'catalog', catalog: 'applications' });
        return;
      }
      if (key === 'explorer:technology:technologies') {
        openWorkspaceTab({ type: 'catalog', catalog: 'technologies' });
        return;
      }
      if (key === 'explorer:implmig:programmes') {
        openWorkspaceTab({ type: 'catalog', catalog: 'programmes' });
        return;
      }

      // These are represented as repository folders for now (no CRUD / no new views in this task).
      if (key === 'explorer:governance:principles' || key === 'explorer:governance:requirements') {
        openRouteTab('/governance');
        return;
      }

      openRouteTab('/workspace');
    },
    [openRouteTab, openWorkspaceTab],
  );

  return (
    <div className={styles.explorerTree}>
      <Tree.DirectoryTree
        showIcon
        showLine={{ showLeafIcon: false }}
        blockNode
        selectable
        expandAction={false}
        defaultExpandedKeys={defaultExpandedKeys}
        /* Intentionally keep visual selection empty (no blue highlight). */
        selectedKeys={[]}
        treeData={EXPLORER_TREE_DATA}
        switcherIcon={({ expanded }) => (expanded ? <CaretDownOutlined /> : <CaretRightOutlined />)}
        onSelect={(selectedKeys: React.Key[], info) => {
          const key = selectedKeys?.[0];
          if (typeof key !== 'string') return;

          // Explorer rule: caret/switcher click should ONLY expand/collapse.
          const target = (info?.nativeEvent?.target as HTMLElement | null) ?? null;
          if (target?.closest?.('.ant-tree-switcher')) return;

          setSelection({ kind: 'repository', keys: [key] });
          openForKey(key);
        }}
      />
    </div>
  );
};

export default ExplorerTree;
