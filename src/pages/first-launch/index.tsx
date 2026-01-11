import React from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Button, Card, Form, Input, Radio, Select, Space, Typography, message } from 'antd';

import { useEaRepository } from '@/ea/EaRepositoryContext';
import {
  ARCHITECTURE_SCOPES,
  GOVERNANCE_MODES,
  LIFECYCLE_COVERAGE_OPTIONS,
  REFERENCE_FRAMEWORKS,
  TIME_HORIZONS,
  type ArchitectureScope,
  type GovernanceMode,
  type LifecycleCoverage,
  type ReferenceFramework,
  type TimeHorizon,
} from '@/repository/repositoryMetadata';

const FirstLaunch: React.FC = () => {
  const { createNewRepository, loadRepositoryFromJsonText } = useEaRepository();

  const [mode, setMode] = React.useState<'home' | 'create'>('home');
  const [form] = Form.useForm<{
    repositoryName: string;
    organizationName: string;
    architectureScope: ArchitectureScope;
    referenceFramework: ReferenceFramework;
    governanceMode: GovernanceMode;
    lifecycleCoverage: LifecycleCoverage;
    timeHorizon: TimeHorizon;
  }>();

  const openFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const importFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const readFileAsText = async (file: File) => {
    return await file.text();
  };

  const onOpenFileSelected = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      const res = loadRepositoryFromJsonText(text);
      if (!res.ok) {
        message.error(res.error);
        return;
      }
      message.success('Repository opened.');
    } catch (e: any) {
      message.error(e?.message || 'Failed to open repository.');
    }
  };

  const onImportFileSelected = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      const res = loadRepositoryFromJsonText(text);
      if (!res.ok) {
        message.error(res.error);
        return;
      }
      message.success('Repository imported.');
    } catch (e: any) {
      message.error(e?.message || 'Failed to import repository.');
    }
  };

  return (
    <div style={{ height: '100vh' }}>
      <PageContainer
        ghost
        style={{ height: '100%' }}
        content={
          <div
            style={{
              height: 'calc(100vh - 48px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
          >
            <Card
              style={{ width: 560, maxWidth: '100%' }}
              title="Enterprise Architecture Repository"
            >
              {mode === 'home' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Button type="primary" onClick={() => setMode('create')}>
                    Create New Enterprise Architecture Repository
                  </Button>

                  <Button onClick={() => openFileInputRef.current?.click()}>
                    Open Existing Repository
                  </Button>

                  <Button onClick={() => importFileInputRef.current?.click()}>
                    Import Repository
                  </Button>

                  <input
                    ref={openFileInputRef}
                    type="file"
                    accept="application/json,.json"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      void onOpenFileSelected(e.target.files?.[0]);
                      e.currentTarget.value = '';
                    }}
                  />

                  <input
                    ref={importFileInputRef}
                    type="file"
                    accept="application/json,.json"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      void onImportFileSelected(e.target.files?.[0]);
                      e.currentTarget.value = '';
                    }}
                  />
                </div>
              ) : (
                <>
                  <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
                    Create a repository shell (metadata only). No architecture elements will be created.
                  </Typography.Paragraph>
                  <Form
                    form={form}
                    layout="vertical"
                    requiredMark
                    initialValues={{
                      architectureScope: 'Enterprise',
                      referenceFramework: 'ArchiMate',
                      governanceMode: 'Advisory',
                      lifecycleCoverage: 'Both',
                      timeHorizon: 'Current',
                    }}
                    onFinish={(values) => {
                      const res = createNewRepository(values);
                      if (!res.ok) {
                        message.error(res.error);
                        return;
                      }
                      message.success('Repository created.');
                    }}
                  >
                    <Form.Item
                      label="Repository Name"
                      name="repositoryName"
                      rules={[{ required: true, whitespace: true, message: 'Repository Name is required.' }]}
                    >
                      <Input placeholder="e.g. Tata Group EA Repository" />
                    </Form.Item>

                    <Form.Item
                      label="Organization Name"
                      name="organizationName"
                      rules={[{ required: true, whitespace: true, message: 'Organization Name is required.' }]}
                    >
                      <Input placeholder="e.g. Tata Group" />
                    </Form.Item>

                    <Form.Item
                      label="Architecture Scope"
                      name="architectureScope"
                      rules={[{ required: true, message: 'Architecture Scope is required.' }]}
                    >
                      <Select options={ARCHITECTURE_SCOPES.map((v) => ({ value: v, label: v }))} />
                    </Form.Item>

                    <Form.Item
                      label="Reference Framework"
                      name="referenceFramework"
                      rules={[{ required: true, message: 'Reference Framework is required.' }]}
                    >
                      <Select options={REFERENCE_FRAMEWORKS.map((v) => ({ value: v, label: v }))} />
                    </Form.Item>

                    <Form.Item
                      label="Governance Mode"
                      name="governanceMode"
                      rules={[{ required: true, message: 'Governance Mode is required.' }]}
                    >
                      <Radio.Group>
                        <Space direction="vertical">
                          {GOVERNANCE_MODES.map((v) => (
                            <Radio key={v} value={v}>
                              {v}
                            </Radio>
                          ))}
                        </Space>
                      </Radio.Group>
                    </Form.Item>

                    <Form.Item
                      label="Lifecycle Coverage"
                      name="lifecycleCoverage"
                      rules={[{ required: true, message: 'Lifecycle Coverage is required.' }]}
                    >
                      <Select options={LIFECYCLE_COVERAGE_OPTIONS.map((v) => ({ value: v, label: v }))} />
                    </Form.Item>

                    <Form.Item
                      label="Time Horizon"
                      name="timeHorizon"
                      rules={[{ required: true, message: 'Time Horizon is required.' }]}
                    >
                      <Select options={TIME_HORIZONS.map((v) => ({ value: v, label: v }))} />
                    </Form.Item>

                    <Space style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Button onClick={() => setMode('home')}>Back</Button>
                      <Button type="primary" htmlType="submit">
                        Create Repository
                      </Button>
                    </Space>
                  </Form>
                </>
              )}
            </Card>
          </div>
        }
      />
    </div>
  );
};

export default FirstLaunch;
