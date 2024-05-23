import { Button, Progress, Tooltip, Popconfirm, Badge, Space } from 'antd';
import { useNavigate, useRevalidator } from 'react-router';
import Icon from '@ant-design/icons';
import React, { useState, useEffect } from 'react';
import formatter from '@labelu/formatter';
import { EllipsisText, FlexLayout } from '@labelu/components-react';
import { DownloadOutlined, SettingOutlined, UploadOutlined } from '@ant-design/icons';
import { modal } from '@/StaticAnt';
import { ReactComponent as DeleteIcon } from '@/assets/svg/delete.svg';
import { ReactComponent as OutputIcon } from '@/assets/svg/outputData.svg';
import { deleteTask } from '@/api/services/task';
import Status from '@/components/Status';
import ExportPortal from '@/components/ExportPortal';
import { MediaTypeText } from '@/constants/mediaType';
import type { MediaType } from '@/api/types';
import { TaskStatus } from '@/api/types';
import * as storage from '@/utils/storage';
import ExportData from '../../../../components/ExportData';

import { ActionRow, CardWrapper, MediaBadge, Row, TaskName } from './style';

function MediaTypeTag({ type, status }: React.PropsWithChildren<{ type: MediaType; status: TaskStatus }>) {
  let children = MediaTypeText[type];
  let color = 'var(--color-primary)';
  let bgColor = 'var(--color-primary-bg)';

  if (status === TaskStatus.DRAFT || status === TaskStatus.IMPORTED) {
    children = '草稿';
    color = 'var(--color-warning-text)';
    bgColor = 'var(--color-warning-bg)';
  } else {
    children = MediaTypeText[type];
  }

  return (
    <MediaBadge color={color} bg={bgColor}>
      {children}
    </MediaBadge>
  );
}

const TaskCard = (props: any) => {
  const { cardInfo, className } = props;
  const revalidator = useRevalidator();
  const { stats, id, status } = cardInfo;
  const unDoneSample = stats.new;
  const doneSample = stats.done + stats.skipped;
  const total = unDoneSample + doneSample;
  const navigate = useNavigate();
  const [detailBtnFlag, setdetailBtnFlag] = useState<Boolean>(false)
  const [deleteBtnFlag, setdeleteBtnFlag] = useState<Boolean>(false)
  const [exportBtnFlag, setexportBtnFlag] = useState<Boolean>(false)
  useEffect(() => {
    const menus = JSON.parse(localStorage.getItem('Menu'))
    console.log(menus)
    menus.forEach(item => {
      if (item.name == '数据管理') {
        item.children.forEach(ele => {
          if (ele.name == '数据标注') {
            ele.children.forEach(eles => {
              if (eles.name == '详情') {
                setdetailBtnFlag(true)
              }
              if (eles.name == '删除') {
                setdeleteBtnFlag(true)
              }
              if (eles.name == '导出') {
                setexportBtnFlag(true)
              }
            })
          }
        })
      }
    })
  }, [])
  const turnToAnnotation = (e: any) => {
    if (!e.currentTarget.contains(e.target)) {
      return;
    }

    e.stopPropagation();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    if (!detailBtnFlag) {
      return
    }
    navigate('/home/tasks/' + id);
  };
  const username = storage.get('username');
  const returnPag = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();

  };
  const handleDeleteTask = (e: React.MouseEvent<HTMLElement>) => {
    deleteTask(id);
    revalidator.revalidate();
  };
  const handleGoConfig = (e: React.MouseEvent<HTMLElement>) => {
    navigate(`/home/tasks/${id}/edit#config`);
    e.stopPropagation();
  };
  const handleGoUpload = (e: React.MouseEvent<HTMLElement>) => {
    navigate(`/home/tasks/${id}/edit#upload`);
    e.stopPropagation();
  };
  return (
    <CardWrapper className={className} onClick={turnToAnnotation} gap=".5rem">
      <Row justify="space-between">
        <FlexLayout items="center" gap=".5rem">
          <EllipsisText maxWidth={120} title={cardInfo.name}>
            <TaskName>{cardInfo.name}</TaskName>
          </EllipsisText>
          <MediaTypeTag type={cardInfo.media_type as MediaType} status={cardInfo.status} />
        </FlexLayout>
        <ActionRow justify="flex-end" items="center">
          <Tooltip placement={'top'} title={'任务配置'} onClick={handleGoConfig}>
            <Button size="small" type="text" icon={<SettingOutlined />} />
          </Tooltip>
          <Tooltip placement={'top'} title={'数据导入'} onClick={handleGoUpload}>
            <Button size="small" type="text" icon={<DownloadOutlined />} />
          </Tooltip>
          <ExportData taskId={cardInfo.id} mediaType={cardInfo.media_type}>
            <Tooltip placement={'top'} title={'导出数据集'}>
              <Button size="small" type="text" icon={<Icon component={OutputIcon} />} />
            </Tooltip>
          </ExportData>
          {/* {
            exportBtnFlag ? <ExportPortal taskId={cardInfo.id} mediaType={cardInfo.media_type}>
              <Tooltip placement={'top'} title={'数据导出'}>
                <Button size="small" type="text" icon={<Icon component={OutputIcon} />} />
              </Tooltip>
            </ExportPortal> : ''
          } */}
          {(
            deleteBtnFlag ?
              // <Tooltip title="删除任务" placement={'top'}>
              <Popconfirm
                title="删除任务"
                description="确定删除该任务吗？"
                onConfirm={handleDeleteTask}
                okText="确认"
                cancelText="取消"
              >
                <Button onClick={returnPag} size="small" type="text" icon={<Icon component={DeleteIcon} />} />
              </Popconfirm>
              // </Tooltip>
              : ''
          )}
        </ActionRow>
      </Row>

      <Row>创建人:{cardInfo.creator?.username}</Row>
      <Row>{formatter.format('dateTime', cardInfo.created_at, { style: 'YYYY-MM-DD HH:mm' })}</Row>

      {/* {doneSample === total && status !== 'DRAFT' && status !== 'IMPORTED' && (
        <FlexLayout gap=".5rem">
          <FlexLayout.Header>
            {total}/{total}
          </FlexLayout.Header>
          <FlexLayout.Footer>
            <Status type="success">已完成</Status>
          </FlexLayout.Footer>
        </FlexLayout>
      )} */}
      {/* {doneSample !== total && status !== 'DRAFT' && status !== 'IMPORTED' && (
        <FlexLayout gap=".5rem">
          <FlexLayout.Content>
            <Progress percent={Math.trunc((doneSample * 100) / total)} showInfo={false} />
          </FlexLayout.Content>
          <FlexLayout.Footer>
            {doneSample}/{total}
          </FlexLayout.Footer>
        </FlexLayout>
      )} */}
      <Space style={{ marginTop: '20px' }}>
        <Badge status="default" text={'未标注:'} />
        <span style={{
          fontSize: '18px',
          fontWeight: 'bold'
        }}>{cardInfo.stats.new}</span>
        <Badge status="warning" text={'跳过: '} />
        <span style={{
          fontSize: '18px',
          fontWeight: 'bold'
        }}>{cardInfo.stats.skipped}</span>
        <Badge status="processing" text={'已标注: '} />
        <span style={{
          fontSize: '18px',
          fontWeight: 'bold'
        }}>{cardInfo.stats.done}</span>
      </Space>
    </CardWrapper>
  );
};
export default TaskCard;
