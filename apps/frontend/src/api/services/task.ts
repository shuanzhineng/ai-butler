import request from '../request';
import type {
  AttachmentDeleteCommand,
  BasicConfigCommand,
  CreateApiV1TasksTaskIdAttachmentsPostParams,
  DeleteApiV1TasksTaskIdAttachmentsDeleteParams,
  ListByApiV1TasksGetParams,
  OkRespAttachmentResponse,
  OkRespCommonDataResp,
  OkRespTaskResponse,
  OkRespTaskResponseWithStatics,
  TaskListResponseWithStatics,
  UpdateCommand,
} from '../types';

export async function getTask(taskId: string): Promise<OkRespTaskResponseWithStatics> {
  return await request.get(`/data/label-tasks/${taskId}`, {
    params: {
      task_id: taskId,
    },
  });
}

export async function createTaskWithBasicConfig(data: BasicConfigCommand): Promise<OkRespTaskResponse> {
  return await request.post('/data/label-tasks', data);
}

export async function uploadFile(
  params: CreateApiV1TasksTaskIdAttachmentsPostParams & {
    file: File;
  },
): Promise<OkRespAttachmentResponse> {
  const data = new FormData();

  if (params.file) {
    data.append('file', params.file);
  }
  if (params.path) {
    data.append('dir_name', params.path);
  }

  return await request.post(`/data/label-tasks/${params.task_id}/attachments`, data, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
}

export async function deleteFile(
  { task_id, ...restParams }: DeleteApiV1TasksTaskIdAttachmentsDeleteParams,
  body: AttachmentDeleteCommand,
): Promise<OkRespCommonDataResp> {
  return await request.delete(`/data/label-tasks/${task_id}/bulk-delete-attachments`, {
    params: restParams,
    data: body,
  });
}

export async function updateTaskConfig(taskId: string, taskConfig: UpdateCommand): Promise<OkRespTaskResponse> {
  return await request.patch(`/data/label-tasks/${taskId}`, taskConfig);
}

export async function getTaskList({ ...params }: ListByApiV1TasksGetParams): Promise<TaskListResponseWithStatics> {
  return await request.get('/data/label-tasks', {
    params: {
      // page_size: 16,
      // page: page ? page - 1 : 1,
      ...params,
    },
  });
}

export async function deleteTask(taskId: number): Promise<OkRespCommonDataResp> {
  return await request.delete(`/data/label-tasks/${taskId}`, {
    params: {
      task_id: taskId,
    },
  });
}
