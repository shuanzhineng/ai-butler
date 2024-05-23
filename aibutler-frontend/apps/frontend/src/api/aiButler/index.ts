import request from '../request';
import type {
  CreateDataGroup,
  CreateDataSets,
  DataSetDownloadUrlResponse,
  DataSetUploadUrlResponse,
  GetDatagroup,
  GetDataSetsResponse,
  MenuButtonListResponse,
  OkRespTreedept,
  OkRespTreeFull,
  SetCreateBtn,
  SetCreateDatagroup,
  SetCreateDepts,
  SetCreateMenu,
  SetCreatemodel,
  SetCreatetrain,
  TrainGroupListResponse,
  TrainTaskListResponse,
  TreeDetailResponse,
  depResponse,
  MenuResponse,
  ModifPsw
} from '../types';

//获取完整菜单树
export async function getTreeFull(): Promise<OkRespTreeFull> {
  return await request.get(`/system/menus/full-tree`);
}
//创建菜单
export async function createMenu(params: SetCreateMenu) {
  return await request.post('/system/menus', params);
}

//获取菜单列表
export async function getTreeData(): Promise<OkRespTreeFull> {
  return await request.get(`/system/menus`);
}
//获取菜单详情  /system/menus/{{menu_id}}
export async function getTreeDetail(menu_id: number): Promise<TreeDetailResponse> {
  return await request.get(`/system/menus/${menu_id}`);
}
//修改菜单  /system/menus/{{menu_id}}
export async function putTree(menu_id: number, params: SetCreateMenu): Promise<TreeDetailResponse> {
  return await request.put(`/system/menus/${menu_id}`, params);
}
//删除菜单   /system/menus/{{menu_id}}
export async function deleteTree(menu_id: number): Promise<TreeDetailResponse> {
  return await request.delete(`/system/menus/${menu_id}`);
}
//创建菜单对应的权限按钮 /system/menus/buttons/{{button_id}}

export async function createBtn(
  // button_id: string | null,
  params: SetCreateBtn,
): Promise<TreeDetailResponse> {
  return await request.post(`/system/menus/buttons`, params);
}
//获取菜单对应的权限按钮 /system/menus/{{menu_id}}/buttons?page=1&size=10
export async function getBtnlist(menu_id: string | null, paramas: object): Promise<MenuButtonListResponse> {
  return await request.get(`/system/menus/${menu_id}/buttons`, {
    params: {
      // page_size: 16,
      // page: page ? page - 1 : 1,
      ...paramas,
    },
  });
}

//获取部门完整树  /system/depts/full-tree
export async function getTreedepts(): Promise<OkRespTreeFull> {
  return await request.get(`/system/depts/full-tree`);
}
//创建部门  /system/depts
export async function createDepts(params: SetCreateDepts): Promise<OkRespTreeFull> {
  return await request.post(`/system/depts`, params);
}
//查看部门详情  /system/depts/{{dept_id}}
export async function getdeptsDetail(dept_id: number): Promise<depResponse> {
  return await request.get(`/system/depts/${dept_id}`);
}
//修改部门  /system/depts/{{dept_id}}
export async function putdepts(dept_id: number, params: SetCreateDepts): Promise<TreeDetailResponse> {
  return await request.put(`/system/depts/${dept_id}`, params);
}
//删除部门 /system/depts/{{dept_id}}
export async function deletedepts(dept_id: number): Promise<TreeDetailResponse> {
  return await request.delete(`/system/depts/${dept_id}`);
}
//获取部门列表 /system/depts?page=1&size=10&parent_id=
// export async function getdepts(params:any): Promise<OkRespTreedept> {
//   // return await request.get(`/system/depts/unfold`)
//   return await request.get(`/system/depts/unfold`)
// }

export async function getdepts({ ...params }): Promise<OkRespTreedept> {
  return await request.get('/system/depts/unfold', {
    params: {
      // page_size: 16,
      // page: page ? page - 1 : 1,
      ...params,
    },
  });
}
//修改菜单权限   /system/menus/buttons/{{button_id}}
export async function putmenu(button_id: string | null, params: SetCreateBtn): Promise<TreeDetailResponse> {
  return await request.put(`/system/menus/buttons/${button_id}`, params);
}

//删除对应菜单  /system/menus/buttons/{button_id}

export async function deletebtn(button_id: number): Promise<TreeDetailResponse> {
  return await request.delete(`/system/menus/buttons/${button_id}`);
}
//创建数据集组
export async function createDatagroups(params: SetCreateDatagroup): Promise<OkRespTreeFull> {
  return await request.post(`/data/data-set-groups`, params);
}
//数据集组列表
export async function getDatagrouop(params: any): Promise<GetDatagroup> {
  return await request.get('/data/data-set-groups', {
    params: params,
  });
}
//修改数据集组
export async function putdatagroup(
  data_set_group_id: string | null,
  params: CreateDataGroup,
): Promise<TreeDetailResponse> {
  return await request.put(`/data/data-set-groups/${data_set_group_id}`, params);
}
//删除数据集组
export async function deletedatagroup(data_set_group_id: number): Promise<TreeDetailResponse> {
  return await request.delete(`/data/data-set-groups/${data_set_group_id}`);
}
//查询数据集组详情
export async function getdatagroupDetail(data_set_group_id: string | null): Promise<TreeDetailResponse> {
  return await request.get(`/data/data-set-groups/${data_set_group_id}`);
}
//获取文件上传地址
export async function getfile({ ...params }): Promise<DataSetUploadUrlResponse> {
  return await request.get('/data/data-set-groups/presigned-upload-url', {
    params: {
      // page_size: 16,
      // page: page ? page - 1 : 1,
      ...params,
    },
  });
}
//put文件上传

export async function apiUpload(url: string, params: object) {
  // const result = await request.post('/account/oauth2/token', params);
  const result = await request({
    url: url,
    method: 'put',
    data: params,
    headers: {
      'Content-Type': 'application/octet-stream',
    },
  });
  return result;
}
//创建数据集
export async function createDataSet(data_set_group_id: string | null, params: CreateDataSets): Promise<OkRespTreeFull> {
  return await request.post(`/data/data-set-groups/${data_set_group_id}/data-sets`, params);
}
//获取数据集列表
export async function getDataSetList(
  data_set_group_id: string | null,
  params: object = {},
): Promise<GetDataSetsResponse> {
  return await request.get(`/data/data-set-groups/${data_set_group_id}/data-sets`, {
    params: params,
  });
}
//删除数据集
export async function deleteDataSet(
  data_set_group_id: string | null,
  data_set_id: string | null,
): Promise<{ code: string; msg: string }> {
  return await request.delete(`/data/data-set-groups/${data_set_group_id}/data-sets/${data_set_id}`);
}
//获取下载数据集url
export async function getDataSetDownloadUrl(
  data_set_group_id: string | null,
  data_set_id: string | null,
): Promise<DataSetDownloadUrlResponse> {
  return await request.get(`/data/data-set-groups/${data_set_group_id}/data-sets/${data_set_id}/download-url`);
}
//创建模型训练组
export async function createTrainlist(params: SetCreatetrain): Promise<OkRespTreeFull> {
  return await request.post(`/ai-models/train-task-groups`, params);
}
//查询模型训练任务组列表
export async function getTrainlist(params: object): Promise<TrainGroupListResponse> {
  return await request.get(`/ai-models/train-task-groups`, {
    params: {
      ...params,
    },
  });
}
//修改模型训练任务组
export async function putTrainlist(
  data_set_group_id: string | null,
  params: SetCreatetrain,
): Promise<TreeDetailResponse> {
  return await request.put(`/ai-models/train-task-groups/${data_set_group_id}`, params);
}
//查询模型训练任务组详情
export async function getmodeldetail(group_id: string | null): Promise<TreeDetailResponse> {
  return await request.get(`/ai-models/train-task-groups/${group_id}`);
}
//创建训练任务
export async function createmodeltasks(group_id: string | null, params: SetCreatemodel): Promise<OkRespTreeFull> {
  return await request.post(`/ai-models/train-task-groups/${group_id}/tasks`, params);
}
//获取训练任务列表
export async function getmodellist(group_id: string | null, params: object): Promise<TrainTaskListResponse> {
  return await request.get(`ai-models/train-task-groups/${group_id}/tasks`, {
    params: {
      ...params,
    },
  });
}
//创建在线应用
export async function createapponline(params: object): Promise<OkRespTreeFull> {
  return await request.post(`/applications/deploy-online-infers`, params);
}
//在线应用列表
export async function getonlinelist(params: object): Promise<TreeDetailResponse> {
  return await request.get(`/applications/deploy-online-infers`, {
    params: {
      ...params,
    },
  });
}
//获取菜单  /account/user-menus
export async function getMenu(): Promise<MenuResponse> {
  return await request.get(`/account/user-menus`);
}
//训练任务详情
export async function getmodelDetail(group_id: string | null, task_id: string | null): Promise<TreeDetailResponse> {
  return await request.get(`/ai-models/train-task-groups/${group_id}/tasks/${task_id}`);
}
//删除模型任务组 /ai-models/train-task-groups/{{group_id}}
export async function deletemodelid(group_id: number): Promise<TreeDetailResponse> {
  return await request.delete(`/ai-models/train-task-groups/${group_id}`);
}
//修改密码    /system/users/{{user_id}}/password
export async function putpassw(user_id: string | null, params: ModifPsw): Promise<TreeDetailResponse> {
  return await request.put(`/system/users/${user_id}/password`, params);
}
//下载训练结果权重文件 /ai-models/train-task-groups/{{group_id}}/tasks/{{task_id}}/download-weight
export async function downweight(group_id: string | null, task_id: string | null): Promise<TreeDetailResponse> {
  return await request.get(`/ai-models/train-task-groups/${group_id}/tasks/${task_id}/download-weight`);
}
// 下载训练日志 /ai-models/train-task-groups/{{group_id}}/tasks/{{task_id}}/download-log
export async function downlog(group_id: string | null, task_id: string | null): Promise<TreeDetailResponse> {
  return await request.get(`/ai-models/train-task-groups/${group_id}/tasks/${task_id}/download-log`);
}
//数据标注任务详情
export async function dataDetail(task_id: string | null): Promise<TreeDetailResponse> {
  return await request.get(`/data/label-tasks/${task_id}`);
}
