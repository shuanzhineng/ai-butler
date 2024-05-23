import { UploadOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate, useRouteLoaderData } from 'react-router';
import { Button } from 'antd';
import _ from 'lodash-es';
import styled from 'styled-components';
import React, { useState, useEffect } from 'react';
import { FlexLayout } from '@labelu/components-react';

import type { TaskLoaderResult } from '@/loaders/task.loader';
import { MediaType } from '@/api/types';

import commonController from '../../../../utils/common';
import ExportPortal from '../../../../components/ExportPortal';
import ExportData from '../../../../components/ExportData';
console.log('数据局到处')
const Circle = styled.div<{
  color: string;
}>`
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background-color: ${({ color }) => color};
`;

export interface TaskStatusProps {
  status?: 'done' | 'new' | 'skipped';
  count?: number;
}

export function TaskStatus({ children, status, count }: React.PropsWithChildren<TaskStatusProps>) {
  const colorMapping = {
    done: 'var(--color-primary)',
    new: 'var(--color-text-tertiary)',
    skipped: 'var(--orange)',
  };

  const textMapping = {
    done: '已标注',
    new: '未标注',
    skipped: '跳过',
  };

  const color = status ? colorMapping[status] : colorMapping.new;
  const title = status ? textMapping[status] : children;

  return (
    <FlexLayout items="center" gap=".5rem">
      {status && <Circle color={color} />}
      <b>{title}</b>
      {count && <b>{count}</b>}
    </FlexLayout>
  );
}

const Statistical = () => {
  const routerLoaderData = useRouteLoaderData('task') as TaskLoaderResult;
  const taskData = _.get(routerLoaderData, 'task');
  console.log(taskData)
  const { stats = {} } = taskData?.details || {};
  const taskId = _.get(taskData?.details, 'id');
  const mediaType = _.get(taskData?.details, 'media_type', MediaType.IMAGE);

  const samples = _.get(routerLoaderData, 'samples');
  console.log(samples)

  const navigate = useNavigate();

  const handleGoAnnotation = () => {
    console.log(samples)
    if (!samples || samples.details.items.length === 0) {
      return;
    }

    navigate(`/home/tasks/${taskId}/samples/${samples.details.items[0].id}`);
  };
  const handleGoConfig = () => {
    navigate(`/home/tasks/${taskId}/edit#config`);
  };
  const handleGoUpload = () => {
    navigate(`/home/tasks/${taskId}/edit#upload`);
  };
  const [startFlag, setstartFlag] = useState<Boolean>(false)
  const [exportFlag, setexportFlag] = useState<Boolean>(false)
  useEffect(() => {
    const menus = JSON.parse(localStorage.getItem('Menu'))
    console.log(menus)
    menus.forEach(item => {
      if (item.name == '数据管理') {
        item.children.forEach(ele => {
          if (ele.name == '数据标注') {
            ele.children.forEach(eles => {
              if (eles.name == '标注') {
                setstartFlag(true)
              }
              if (eles.name == '导出') {
                setexportFlag(true)
              }
            })
          }
        })
      }
    })
  }, [])
  return (
    <FlexLayout justify="space-between" items="center">
      {/* <FlexLayout items="center" gap="3rem">
        <b>数据总览</b>
        <TaskStatus status="done" count={stats.done} />
        <TaskStatus status="new" count={stats.new} />
        <TaskStatus status="skipped" count={stats.skipped} />
        <TaskStatus count={stats.done! + stats.new! + stats.skipped!}>总计</TaskStatus>
      </FlexLayout> */}
      <FlexLayout gap=".5rem">
        {/* <Button type="text" icon={<SettingOutlined />} onClick={handleGoConfig}>
          任务配置
        </Button> */}
        {/* {
          exportFlag ? <ExportPortal taskId={taskId} mediaType={mediaType}>
            <Button type="text" icon={<UploadOutlined />}>
              数据导出
        </Button>
          </ExportPortal> : ''
        } */}
        {/* {
          exportFlag ? <ExportData taskId={taskId} mediaType={mediaType}>
            <Button type="primary" icon={<UploadOutlined />}>
              导出数据集
          </Button>
          </ExportData> : ''
        } */}
        {/* <Button type="primary" ghost onClick={handleGoUpload}>
          数据导入
        </Button> */}

        {
          startFlag ? <Button type="primary" onClick={commonController.debounce(handleGoAnnotation, 100)}
            style={{
              // marginLeft: '20px',
              marginBottom: '20px',
            }}>
            开始标注
        </Button> : ''
        }
      </FlexLayout>
    </FlexLayout>
  );
};
export default Statistical;
