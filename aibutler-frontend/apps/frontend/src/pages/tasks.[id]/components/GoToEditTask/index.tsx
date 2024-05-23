import { InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router';
import { Button } from 'antd';
import { FlexLayout } from '@labelu/components-react';

import { TaskStatus } from '@/api/types';

const GoToEditTask = (props: any) => {
  const { taskStatus } = props;
  const navigate = useNavigate();
  const routeParams = useParams();
  const taskId = routeParams.taskId;

  const handleConfigClick = () => {
    console.log(taskId)
    if (taskId != 0) {
      let tail = 'basic';
      switch (taskStatus) {
        case TaskStatus.DRAFT:
          tail = 'basic';
          break;
        case TaskStatus.IMPORTED:
        case TaskStatus.CONFIGURED:
          tail = 'config';
          break;
      }
      navigate('/home/tasks/' + taskId + '/edit#' + tail);
    }
  };

  return (
    <FlexLayout items="center" gap=".5rem">
      <InfoCircleOutlined style={{ color: '#F5483B' }} />
      <div>请先完成任务配置， 再开始标注</div>
      <Button type="primary" ghost onClick={handleConfigClick}>
        去配置
      </Button>
    </FlexLayout>
  );
};
export default GoToEditTask;
