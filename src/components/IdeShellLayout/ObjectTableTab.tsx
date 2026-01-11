import React from 'react';
import { Table, Typography } from 'antd';

type ObjectTableTabProps = {
  id: string;
  name: string;
  objectType: string;
};

const ObjectTableTab: React.FC<ObjectTableTabProps> = ({ id, name, objectType }) => {
  return (
    <div style={{ padding: 12 }}>
      <div style={{ marginBottom: 10 }}>
        <Typography.Text strong>{name}</Typography.Text>
        <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
          {objectType}
        </Typography.Text>
      </div>
      <Table
        size="small"
        pagination={false}
        rowKey="id"
        columns={[
          { title: 'Name', dataIndex: 'name' },
          { title: 'Type', dataIndex: 'type' },
          { title: 'Status', dataIndex: 'status' },
        ]}
        dataSource={[{ id, name, type: objectType, status: '—' }]}
      />
    </div>
  );
};

export default ObjectTableTab;
