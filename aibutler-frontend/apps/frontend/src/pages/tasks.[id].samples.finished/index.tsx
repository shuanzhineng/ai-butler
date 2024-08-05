import { CheckOutlined } from '@ant-design/icons';
import { useNavigate, useParams, useRevalidator, useRouteLoaderData } from 'react-router';
import { Button } from 'antd';
import styled from 'styled-components';
import { FlexLayout } from '@labelu/components-react';

import ExportPortal from '@/components/ExportPortal';
import type { TaskLoaderResult } from '@/loaders/task.loader';
import ExportData from '../../components/ExportData';
const Wrapper = styled(FlexLayout)`
  background: #fff;
  height: calc(100vh - var(--header-height));
`;

const Inner = styled(FlexLayout.Item)`
  width: 312px;
  height: 290px;
`;

const CircleCheck = styled(FlexLayout.Item)`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: var(--color-success-bg);
`;

const Statistic = styled(FlexLayout)`
  font-size: 1rem;
`;

const ButtonWrapper = styled(FlexLayout)`
  button {
    padding: 0.375rem 2.5rem !important;
    height: 3rem !important;
  }
`;

const SamplesFinished = () => {
  const { task: taskData } = useRouteLoaderData('task') as TaskLoaderResult;
  const routeParams = useParams();
  const taskId = routeParams.taskId;
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const handleGoHome = () => {
    // navigate(`/tasks`);
    navigate(`/home/tasks/${taskId}?t=${Date.now()}`);
    setTimeout(revalidator.revalidate);
  };
  console.log(taskData)
  return (
    <Wrapper flex="column" items="center" justify="center">
      <Inner flex="column" justify="space-between" items="center">
        <CircleCheck items="center" justify="center" flex>
          <CheckOutlined style={{ color: 'var(--color-success)', fontSize: '40px' }} />
        </CircleCheck>
        <h1>标注完成</h1>
        <Statistic>
          <div>已标注： {taskData?.details.stats?.done}，</div>
          <div>
            未标注： <span style={{ color: 'red' }}>{taskData?.details.stats?.new}</span>，
          </div>
          <div>跳过：{taskData?.details.stats?.skipped}</div>
        </Statistic>
        <ButtonWrapper gap="1.5rem">
          {/* <ExportPortal taskId={taskId} mediaType={taskData?.details.media_type}>
            <Button type="primary" size="large">
              导出数据
            </Button>
          </ExportPortal> */}



          <ExportData taskId={taskId} mediaType={taskData?.details.media_type}>
          <Button type="primary" size="large">
              导出数据
            </Button>
          </ExportData>





          <Button type="default" size="large" onClick={handleGoHome}>
            返回主页
          </Button>
        </ButtonWrapper>
      </Inner>
    </Wrapper>
  );
};

export default SamplesFinished;
