import commonController from '../../utils/common';
import request from '../request';
import type {
  DeleteApiV1TasksTaskIdDeleteParams,
  DeleteSampleCommand,
  GetApiV1TasksTaskIdSamplesSampleIdGetParams,
  GetPreApiV1TasksTaskIdSamplesSampleIdPreGetParams,
  ListByApiV1TasksTaskIdSamplesGetParams,
  OkRespCommonDataResp,
  OkRespCreateSampleResponse,
  OkRespSampleResponse,
  PatchSampleCommand,
  SampleData,
  SampleListResponse,
  SampleResponse,
  UpdateApiV1TasksTaskIdSamplesSampleIdPatchParams,
} from '../types';

export async function createSamples(
  taskId: string,
  data: {
    attachement_ids: number[];
    data: SampleData;
  }[],
): Promise<OkRespCreateSampleResponse> {
  return await request.post(`/data/label-tasks/${taskId}/samples`, {
    items: data
  });
}

export async function getSamples({
  task_id,
  ...params
}: ListByApiV1TasksTaskIdSamplesGetParams): Promise<SampleListResponse> {
  return await request.get(`/data/label-tasks/${task_id}/samples`, {
    params: {
      ...params,
      // page: typeof params.pageNo === 'undefined' ? 0 : params.pageNo - 1,
    },
  });
}

export async function getSample({
  task_id,
  sample_id,
}: GetApiV1TasksTaskIdSamplesSampleIdGetParams): Promise<OkRespSampleResponse> {
  return await request.get(`/data/label-tasks/${task_id}/samples/${sample_id}`);
}
export async function getdataSet({
  ...params
}: GetApiV1TasksTaskIdSamplesSampleIdGetParams): Promise<OkRespSampleResponse> {
  return await request.get(`/data/data-set-groups`, {
    params: {
      ...params,
      // page: typeof params.pageNo === 'undefined' ? 0 : params.pageNo - 1,
    },
  });
}

// export async function exportDataSet(
//   { task_id, data }: UpdateApiV1TasksTaskIdSamplesSampleIdPatchParams,
//   body: PatchSampleCommand,
// ): Promise<SampleResponse> {
//   return await request.post(`/v1/labelu/label-tasks/${task_id}/samples/export-to-datasets`, data);
// }

export async function exportDataSet(taskId: string, data: any): Promise<OkRespCreateSampleResponse> {
  return await request.post(`/data/label-tasks/${taskId}/samples/export-to-data-sets`, data);
}

export async function updateSampleState(
  { task_id, sample_id, ...params }: UpdateApiV1TasksTaskIdSamplesSampleIdPatchParams,
  body: PatchSampleCommand,
): Promise<SampleResponse> {
  return await request.patch(`/data/label-tasks/${task_id}/samples/${sample_id}`, body, {
    params: {
      sample_id,
      ...params,
    },
  });
}

export async function updateSampleAnnotationResult(
  taskId: number,
  sampleId: number,
  data: SampleResponse,
): Promise<SampleResponse> {
  return await request.patch(
    `/data/label-tasks/${taskId}/samples/${sampleId}`,
    {
      data: data.data,
      state: data.state,
      annotated_count: data.annotated_count,
    },
    {
      params: {
        sample_id: sampleId,
      },
    },
  );
}

export async function outputSample(taskId: string, sampleIds: number[], activeTxt: string) {
  // TODO: 后期改成前端导出，不调用后端接口
  let res = await request.post(
    `/labelu/label-tasks/${taskId}/samples/export`,
    {
      sample_ids: sampleIds,
    },
    {
      params: {
        task_id: taskId,
        export_type: activeTxt,
      },
    },
  );

  if (activeTxt === 'MASK') {
    res = await request.post(
      `/v1/tasks/${taskId}/samples/export`,
      {
        sample_ids: sampleIds,
      },
      {
        params: {
          task_id: taskId,
          export_type: activeTxt,
        },
        responseType: 'blob',
      },
    );
  }
  const data = res.data;
  // const taskRes = await getTask(taskId);
  let blobData;
  if (activeTxt == 'json') {
    blobData = new Blob([JSON.stringify(data)]);
  } else {
    blobData = new Blob([data]);
  }
  const url = window.URL.createObjectURL(blobData);
  const a = document.createElement('a');
  const filename = res.headers['content-disposition'].slice(
    res.headers['content-disposition'].indexOf('=') + 2,
    res.headers['content-disposition'].length - 1,
  );

  a.download = decodeURIComponent(escape(window.atob(filename)))!;
  a.href = url;
  a.click();
}

export async function outputSamples(taskId: string, activeTxt: string) {
  console.log(taskId)
  const samplesRes = await getSamples({ task_id: taskId, page: 1, size: 50 });
  let sampleIdArrays = [];
  let sampleIds = [];


  if (samplesRes.details.pages && samplesRes.details.pages > 1) {
    let apiary = []
    for (let i = 1; i <= samplesRes.details.pages; i++) {
      apiary[i] = getSamples({ task_id: taskId, page: i, size: 50 });;
    }


    Promise.all(apiary.map((p) => p.catch((err) => "")))
      .then((res) => {
        res.forEach((ele, indexs) => {
          console.log(ele);

          if (ele) {
            ele.details.items.forEach(itemss => {
              sampleIdArrays.push(itemss)
            })
          }

        });
      })
      .catch((err) => { })
      .finally(() => {
        console.log("最后");
        console.log(sampleIdArrays)
        for (const sample of sampleIdArrays) {
          sampleIds.push(sample.id!);
        }

        if (sampleIds.length === 0) {
          commonController.notificationErrorMessage({ message: '后端返回数据出现问题' }, 1);
          return;
        }

        outputSample(taskId, sampleIds, activeTxt);

        return true;
      });




  } else {
    sampleIdArrays = samplesRes.details.items;
    for (const sample of sampleIdArrays) {
      sampleIds.push(sample.id!);
    }

    if (sampleIds.length === 0) {
      commonController.notificationErrorMessage({ message: '后端返回数据出现问题' }, 1);
      return;
    }

    await outputSample(taskId, sampleIds, activeTxt);

    return true;

  }

  //  sampleIdArrays = samplesRes.details.items;

  // for (const sample of sampleIdArrays) {
  //   sampleIds.push(sample.id!);
  // }

  // if (sampleIds.length === 0) {
  //   commonController.notificationErrorMessage({ message: '后端返回数据出现问题' }, 1);
  //   return;
  // }

  // await outputSample(taskId, sampleIds, activeTxt);

  // return true;
}

export async function deleteSamples(
  { task_id }: DeleteApiV1TasksTaskIdDeleteParams,
  body: DeleteSampleCommand,
): Promise<OkRespCommonDataResp> {
  return await request.delete(`/v1/tasks/${task_id}/samples`, {
    data: body,
  });
}

export async function getPreSample({
  sample_id,
  task_id,
}: GetPreApiV1TasksTaskIdSamplesSampleIdPreGetParams): Promise<OkRespSampleResponse> {
  return await request.get(`/v1/tasks/${task_id}/samples/${sample_id}/pre`);
}
