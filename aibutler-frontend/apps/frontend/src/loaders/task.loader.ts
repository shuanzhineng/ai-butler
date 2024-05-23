import type { LoaderFunctionArgs } from 'react-router';
import { ConsoleSqlOutlined } from '@ant-design/icons';

import { sampleKey, taskKey } from '@/api/queryKeyFactories';
import { getTaskList, getTask } from '@/api/services/task';
import queryClient from '@/api/queryClient';
import { getSamples } from '@/api/services/samples';
import type { SampleListResponse, TaskResponseWithStatics } from '@/api/types';
import type { ToolsConfigState } from '@/types/toolConfig';

export async function tasksLoader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);
  const queryParams = Object.fromEntries(searchParams.entries());
  console.log(queryParams)
  console.log(request.url)
  const regex = new RegExp('/', 'g'); // 创建全局匹配模式的正则表达式对象
  // console.log(request.url.match(regex).length)
  const params = {
    page: queryParams.page ? queryParams.page : 1,
    size: 10,
  }
  console.log(params)
  console.log(request.url.match(regex))
  if (searchParams.has('clientId')) {
    return null;
  }

  return await queryClient.fetchQuery({
    queryKey: taskKey.list(params),
    queryFn: () => getTaskList(params),
  });
}

export type TaskInLoader = Omit<TaskResponseWithStatics, 'config'> & {
  config: ToolsConfigState;
};

export interface TaskLoaderResult {
  samples?: SampleListResponse;
  task?: TaskInLoader;
}

export async function taskLoader({ params, request }: LoaderFunctionArgs) {
  const result: TaskLoaderResult = {
    samples: undefined,
    task: undefined,
  };

  // taskId 为 0 时，表示新建任务
  if (!params?.taskId || params.taskId === '0') {
    return result;
  }

  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);
  const queryParams = {
    task_id: params.taskId,
    ...Object.fromEntries(searchParams.entries()),
  };
  console.log(queryParams)
  const sampleQueryKey = sampleKey.list(queryParams);

  result.samples = await queryClient.fetchQuery({
    queryKey: sampleQueryKey,
    queryFn: () => getSamples(queryParams),
  });
  console.log(result)
  console.log(params)
  const taskDetail = await queryClient.fetchQuery({
    queryKey: taskKey.detail(params.taskId),
    queryFn: () => getTask(params.taskId),
  });
  console.log(taskDetail)
  if (taskDetail) {
    result.task = {
      ...taskDetail,
      config: taskDetail.details.config ? JSON.parse(taskDetail.details.config) : null,
    };
  }

  return result;
}
