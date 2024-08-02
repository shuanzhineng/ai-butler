from fastapi import APIRouter, Depends, Body
from common.depends import NeedAuthorization, data_range_permission, inner_authentication
from fastapi_pagination import Params, Page
from fastapi_pagination.ext.tortoise import paginate
from common.custom_route import CustomRoute
import aiofiles  # noqa
from http import HTTPStatus
from apps.ai_model.models.db import TrainTaskGroup, TrainTask
from apps.ai_model.models import request, response
from apps.data.models.db import DataSet, OssFile
from tortoise.functions import Count
from common.utils import get_instance, get_current_time
from common.enums import TrainStatusEnum, TrainFrameworkEnum, AnnotationTypeEnum
from celery_app.tasks import pytorch_object_detection_train, paddle_image_classify_train
from common.minio_client import minio_client
from asyncer import asyncify
from loguru import logger
from typing import Any

router = APIRouter(
    prefix="/train-task-groups",
    tags=["训练任务组"],
    responses={404: {"description": "Not found"}},
    route_class=CustomRoute,
)


@router.post("", summary="创建训练任务组", response_model=response.TrainTaskGroupOut, status_code=HTTPStatus.CREATED)
async def create_train_task_group(user: NeedAuthorization, items: request.TrainTaskGroupIn):
    """创建训练任务组"""
    role = await TrainTaskGroup.create(**items.model_dump(), creator=user)
    return role


@router.get("", summary="训练任务组列表", response_model=Page[response.TrainTaskGroupOut])
async def get_train_task_groups(
    name: str = "",
    ai_model_type: str = "",
    query_sets=Depends(data_range_permission(TrainTaskGroup)),
    params=Depends(Params),
):
    """训练任务组列表"""
    if name:
        query_sets = query_sets.filter(name__icontains=name)
    if ai_model_type:
        query_sets = query_sets.filter(ai_model_type=ai_model_type)
    query_sets = query_sets.select_related("creator")
    output = await paginate(query_sets, params=params)
    for item in output.items:
        counts = (
            await TrainTask.filter(train_task_group_id=item.id)
            .group_by("status")
            .annotate(status_count=Count("id"))
            .values_list("status", "status_count")
        )
        task_count_stat = {status: count for status, count in counts}
        for status in TrainStatusEnum:
            if status.value not in task_count_stat:
                task_count_stat[status.value] = 0
        item.task_count_stat = task_count_stat
    return output


@router.get("/{pk}", summary="训练任务组详情", response_model=response.TrainTaskGroupOut)
async def retrieve_train_task_group(
    pk: int,
    query_sets=Depends(data_range_permission(TrainTaskGroup)),
):
    """创建训练任务组"""
    instance = await get_instance(query_sets, pk)
    await instance.fetch_related("creator")
    counts = (
        await TrainTask.filter(train_task_group_id=instance.id)
        .group_by("status")
        .annotate(status_count=Count("id"))
        .values_list("status", "status_count")
    )
    task_count_stat = {status: count for status, count in counts}
    for status in TrainStatusEnum:
        if status.value not in task_count_stat:
            task_count_stat[status.value] = 0
    instance.task_count_stat = task_count_stat
    return instance


@router.put("/{pk}", summary="修改训练任务组", response_model=response.TrainTaskGroupOut)
async def put_train_task_group(
    pk: int,
    items: request.TrainTaskGroupIn,
    user: NeedAuthorization,
    query_sets=Depends(data_range_permission(TrainTaskGroup)),
):
    """创建训练任务组"""
    await get_instance(query_sets, pk)
    await query_sets.filter(id=pk).update(**items.model_dump(), modifier=user)
    instance = await query_sets.get(id=pk)
    await instance.fetch_related("creator")
    counts = (
        await TrainTask.filter(train_task_group_id=instance.id)
        .group_by("status")
        .annotate(status_count=Count("id"))
        .values_list("status", "status_count")
    )
    task_count_stat = {status: count for status, count in counts}
    for status in TrainStatusEnum:
        if status.value not in task_count_stat:
            task_count_stat[status.value] = 0
    instance.task_count_stat = task_count_stat
    return instance


@router.delete("/{pk}", summary="删除训练任务组")
async def delete_train_task_group(pk: int, query_sets=Depends(data_range_permission(TrainTaskGroup))):
    """创建训练任务组"""
    instance = await get_instance(query_sets, pk)
    await TrainTask.filter(train_task_group_id=instance.id).delete()
    await instance.delete()
    return


@router.post(
    "/{group_id}/tasks", summary="创建训练任务", response_model=response.TrainTaskOut, status_code=HTTPStatus.CREATED
)
async def create_train_task(
    group_id: int,
    user: NeedAuthorization,
    items: request.TrainTaskIn,
    query_sets=Depends(data_range_permission(TrainTaskGroup)),
):
    """创建训练任务组"""
    group = await get_instance(query_sets, group_id)
    items = items.model_dump()
    data_set_ids = items.pop("data_set_ids")
    base_task_id = items.pop("base_task_id")
    items.pop("ai_model_type")
    base_task = await TrainTask.filter(id=base_task_id).first()
    data_sets = await DataSet.filter(id__in=data_set_ids)
    last_task = await TrainTask.filter(train_task_group=group).order_by("-version").first()
    if last_task:
        version = last_task.version + 1
    else:
        version = 1
    instance = await TrainTask.create(
        **items, version=version, creator=user, train_task_group=group, base_task=base_task
    )
    await instance.data_sets.add(*data_sets)
    # 异步发起训练任务
    data_set_urls = []
    for data_set_obj in data_sets:
        file = await data_set_obj.file
        download_url = await asyncify(minio_client.presigned_download_file)(file.path)
        data_set_urls.append(download_url)
    pretrain_model_weight_download_url = None
    if base_task:
        base_task_file = await base_task.result_file
        pretrain_model_weight_download_url = await asyncify(minio_client.presigned_download_file)(base_task_file.path)
    year_month = get_current_time().strftime("%Y-%m")
    model_weight_oss_path = f"{user.username}/train/{year_month}/{instance.id}/result.zip"
    train_log_oss_path = f"{user.username}/train/{year_month}/{instance.id}/train.log"
    result_file = await OssFile.create(path=model_weight_oss_path)
    log_file = await OssFile.create(path=train_log_oss_path)
    instance.result_file = result_file
    instance.log_file = log_file
    model_weight_upload_url = await asyncify(minio_client.presigned_upload_file)(result_file.path)
    log_upload_url = await asyncify(minio_client.presigned_upload_file)(log_file.path)
    celery_task = None
    if instance.framework == TrainFrameworkEnum.PYTORCH:
        if group.ai_model_type == AnnotationTypeEnum.OBJECT_DETECTION:
            pytorch_object_detection_train_params = {
                "train_task_id": str(instance.id),
                "network": instance.network,
                "data_set_urls": data_set_urls,
                "pretrain_model_weight_download_url": pretrain_model_weight_download_url,
                "train_params": items["params"],
                "model_weight_upload_url": model_weight_upload_url,
                "log_upload_url": log_upload_url,
            }
            logger.info(f"发起异步训练: {pytorch_object_detection_train_params}")
            celery_task = pytorch_object_detection_train.delay(**pytorch_object_detection_train_params)
    if instance.framework == TrainFrameworkEnum.PADDLEPADDLE:
        if group.ai_model_type == AnnotationTypeEnum.IMAGE_CLASSIFY:
            paddle_image_classify_train_params = {
                "train_task_id": str(instance.id),
                "network": instance.network,
                "data_set_urls": data_set_urls,
                "pretrain_model_weight_download_url": pretrain_model_weight_download_url,
                "train_params": items["params"],
                "model_weight_upload_url": model_weight_upload_url,
                "log_upload_url": log_upload_url,
            }
            logger.info(f"发起异步训练: {paddle_image_classify_train_params}")
            celery_task = paddle_image_classify_train.delay(**paddle_image_classify_train_params)
    if celery_task:
        instance.celery_task_id = str(celery_task.id)
    await instance.save()
    await instance.fetch_related("creator")
    return instance


@router.put("/train-tasks/{task_id}/status", summary="修改训练任务状态", dependencies=[Depends(inner_authentication)])
async def put_train_task_status(task_id: int, status: TrainStatusEnum = Body(embed=True)):
    """外部通过api修改训练任务状态"""
    data = {}
    if status == TrainStatusEnum.TRAINING:
        start_datetime = get_current_time()
        data["start_datetime"] = start_datetime
    elif status in (TrainStatusEnum.FINISH, TrainStatusEnum.FAILURE):
        end_datetime = get_current_time()
        data["end_datetime"] = end_datetime
    await TrainTask.filter(id=task_id).update(**data, status=status)
    return


@router.get("/{group_id}/tasks", summary="训练任务列表", response_model=Page[response.TrainTaskOut])
async def get_train_tasks(
    group_id: int,
    status: TrainStatusEnum | None = None,
    keyword: str = "",
    group_query_sets=Depends(data_range_permission(TrainTaskGroup)),
    query_sets=Depends(data_range_permission(TrainTask)),
    params=Depends(Params),
):
    group = await get_instance(group_query_sets, group_id)
    query_sets = query_sets.filter(train_task_group=group).select_related("creator")
    if status:
        query_sets = query_sets.filter(status=status)
    if keyword:
        query_sets = query_sets.filter(description__icontains=keyword)
    output = await paginate(query_sets, params=params)
    return output


@router.get("/{group_id}/tasks/{pk}", summary="训练任务详情", response_model=response.TrainTaskDetailOut)
async def get_train_task_detail(
    group_id: int,
    pk: int,
    group_query_sets=Depends(data_range_permission(TrainTaskGroup)),
    query_sets=Depends(data_range_permission(TrainTask)),
):
    group = await get_instance(group_query_sets, group_id)
    instance = await get_instance(query_sets, pk)
    await instance.fetch_related("creator")
    datasets = await instance.data_sets.all()
    output: dict[Any, Any] = {}

    for d in datasets:
        file = await d.file
        data_set_group = await d.data_set_group
        if data_set_group.id in output:
            output[data_set_group.id]["children"].append({"id": d.id, "file": {"filename": file.filename}})
        else:
            output[data_set_group.id] = {
                "id": data_set_group.id,
                "name": data_set_group.name,
                "children": [{"id": d.id, "file": {"filename": file.filename}}],
            }
    instance.show_data_sets = list(output.values())
    instance.ai_model_type = group.ai_model_type.value
    await instance.fetch_related("base_task")
    return instance


@router.get("/{group_id}/tasks/{pk}/download-weight", summary="下载训练结果权重")
async def get_train_task_weight(
    group_id: int,
    pk: int,
    group_query_sets=Depends(data_range_permission(TrainTaskGroup)),
    query_sets=Depends(data_range_permission(TrainTask)),
):
    await get_instance(group_query_sets, group_id)
    instance = await get_instance(query_sets, pk)
    file = await instance.result_file
    download_url = await asyncify(minio_client.presigned_download_file)(file.path)
    return {"download_url": download_url}


@router.get("/{group_id}/tasks/{pk}/download-log", summary="下载训练日志")
async def get_train_task_log(
    group_id: int,
    pk: int,
    group_query_sets=Depends(data_range_permission(TrainTaskGroup)),
    query_sets=Depends(data_range_permission(TrainTask)),
):
    await get_instance(group_query_sets, group_id)
    instance = await get_instance(query_sets, pk)
    file = await instance.log_file
    download_url = await asyncify(minio_client.presigned_download_file)(file.path)
    return {"download_url": download_url}
