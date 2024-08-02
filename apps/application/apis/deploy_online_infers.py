from fastapi import APIRouter, Depends
from common.depends import NeedAuthorization, data_range_permission, inner_authentication
from fastapi_pagination import Params, Page
from fastapi_pagination.ext.tortoise import paginate
from common.custom_route import CustomRoute
import aiofiles  # noqa
from http import HTTPStatus
from apps.application.models.db import DeployOnlineInfer
from apps.ai_model.models.db import TrainTask
from apps.application.models import request, response
from celery_app.tasks import deploy_onnx_infer_by_train_task
import uuid
from common.minio_client import minio_client
from common.enums import AnnotationTypeEnum, DeployOnlineInferStatusEnum
from common.utils import get_instance
from tortoise.expressions import Q

router = APIRouter(
    prefix="/deploy-online-infers",
    tags=["在线应用"],
    responses={404: {"description": "Not found"}},
    route_class=CustomRoute,
)


@router.post("", summary="创建在线应用", status_code=HTTPStatus.CREATED, response_model=response.DeployOnlineInferOut)
async def create_online_infers(user: NeedAuthorization, items: request.CreateDeployOnlineInferIn):
    """创建在线应用"""
    items = items.model_dump()
    train_task_id = items.pop("train_task_id")
    is_gpu = items["is_gpu"]
    train_task = await TrainTask.get(id=train_task_id)
    # TOdO校验训练任务id
    token = str(uuid.uuid4().hex)
    instance = await DeployOnlineInfer.create(**items, creator=user, token=token, train_task=train_task)
    file = await train_task.result_file
    train_result_url = minio_client.presigned_download_file(file.path)
    # 发起异步部署
    train_task_group = await train_task.train_task_group
    deploy_onnx_infer_by_train_task.delay(
        str(instance.id), token, train_result_url, is_gpu, service_type=train_task_group.ai_model_type
    )

    await instance.fetch_related("creator")
    train_task_group = await train_task.train_task_group
    instance.train_task_out = {
        "id": train_task.id,
        "ai_model_type": {
            "value": train_task_group.ai_model_type,
            "name": AnnotationTypeEnum.get_display(train_task_group.ai_model_type),
        },
    }
    return instance


@router.get("", summary="在线应用列表", response_model=Page[response.DeployOnlineInferOut])
async def get_online_infers(
    keyword: str = "",
    status: DeployOnlineInferStatusEnum | None = None,
    query_sets=Depends(data_range_permission(DeployOnlineInfer)),
    params=Depends(Params),
):
    """外部通过api修改训练任务状态"""
    query_sets = query_sets.select_related("creator")
    if keyword:
        query_sets = query_sets.filter(Q(name__icontains=keyword) | Q(description__icontains=keyword))
    if status:
        query_sets = query_sets.filter(status=status)
    output = await paginate(query_sets, params=params)
    for item in output.items:
        train_task = await TrainTask.get(id=item.train_task_id)
        train_task_group = await train_task.train_task_group
        item.train_task_out = {
            "id": train_task.id,
            "ai_model_type": {
                "value": train_task_group.ai_model_type,
                "name": AnnotationTypeEnum.get_display(train_task_group.ai_model_type),
            },
        }
    return output


@router.get("/{pk}", summary="在线应用列表", response_model=response.DeployOnlineInferOut)
async def retrieve_online_infer(pk: int, query_sets=Depends(data_range_permission(DeployOnlineInfer))):
    """外部通过api修改训练任务状态"""
    instance = await get_instance(query_sets, pk)
    await instance.fetch_related("creator")
    train_task = await TrainTask.get(id=instance.train_task_id)
    train_task_group = await train_task.train_task_group
    instance.train_task_out = {
        "id": train_task.id,
        "ai_model_type": {
            "value": train_task_group.ai_model_type,
            "name": AnnotationTypeEnum.get_display(train_task_group.ai_model_type),
        },
    }
    return instance


@router.put("/{task_id}", summary="修改在线应用", dependencies=[Depends(inner_authentication)])
async def put_train_task(
    pk: int,
    items: request.PutDeployOnlineInferIn,
    query_sets=Depends(data_range_permission(DeployOnlineInfer)),
):
    """外部通过api修改训练任务状态"""
    instance = await get_instance(query_sets, pk)
    instance.name = items.name
    instance.description = items.description
    await instance.save()
    await instance.fetch_related("creator")
    return instance


@router.delete("/{pk}", summary="在线应用列表", response_model=response.DeployOnlineInferOut)
async def delete_online_infer(pk: int, query_sets=Depends(data_range_permission(DeployOnlineInfer))):
    """外部通过api修改训练任务状态"""
    instance = await get_instance(query_sets, pk)
    await instance.delete()
    return


@router.put("/{task_id}/by-worker", summary="worker修改在线应用", dependencies=[Depends(inner_authentication)])
async def put_train_task_by_worker(task_id: int, items: request.PutDeployOnlineInferByWorkerIn):
    """外部通过api修改训练任务状态"""
    await DeployOnlineInfer.filter(id=task_id).update(**items.model_dump())
    return
