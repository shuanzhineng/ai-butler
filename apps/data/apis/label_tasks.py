from fastapi import APIRouter, Depends, Form, UploadFile, Body, Query
from apps.data.models.db import LabelTask, LabelTaskAttachment, LabelTaskSample, DataSetGroup, DataSet, OssFile
from apps.data.models import request, response
from common.depends import NeedAuthorization, data_range_permission
from fastapi_pagination import Page, Params
from typing import Any
from fastapi_pagination.ext.tortoise import paginate
from common.custom_route import CustomRoute
from common.utils import get_instance
from common.enums import LabelTaskStatusEnum, LabelTaskSampleStateEnum, AnnotationTypeEnum
import os
import json
from tortoise.exceptions import DoesNotExist
from common.exceptions import CommonError, LabelTaskError
import aiofiles  # noqa
from common.utils.labelu_export import converter
import glob
from xml.etree import ElementTree as ET
import shutil
from common.utils import get_current_time
from common.minio_client import minio_client
from asyncer import asyncify

router = APIRouter(
    prefix="/label-tasks", tags=["数据标注"], responses={404: {"description": "Not found"}}, route_class=CustomRoute
)


@router.get("", summary="标注任务列表", response_model=Page[response.LabelTaskOut])
async def label_tasks(query_sets=Depends(data_range_permission(LabelTask)), params=Depends(Params)):
    """标注任务列表"""
    query_sets = query_sets.select_related("creator")
    output = await paginate(query_sets, params=params)
    for item in output.items:
        item.stats = {
            "new": await LabelTaskSample.filter(label_task_id=item.id, state=LabelTaskSampleStateEnum.NEW).count(),
            "done": await LabelTaskSample.filter(label_task_id=item.id, state=LabelTaskSampleStateEnum.DONE).count(),
            "skipped": await LabelTaskSample.filter(
                label_task_id=item.id, state=LabelTaskSampleStateEnum.SKIPPED
            ).count(),
        }
    return output


@router.post("", summary="创建标注任务", response_model=response.LabelTaskOut)
async def create_label_task(user: NeedAuthorization, items: request.LabelTaskIn):
    """创建标注任务"""
    instance = await LabelTask.create(**items.model_dump(), creator=user)
    await instance.fetch_related("creator")
    if items.config and items.config != "{}":
        instance.status = LabelTaskStatusEnum.CONFIGURED
        await instance.save()
    elif items.config:
        instance.status = LabelTaskStatusEnum.IMPORTED
        await instance.save()
    return instance


@router.get("/{pk}", summary="标注任务详情", response_model=response.LabelTaskOut)
async def retrieve_label_task(pk: int, query_sets=Depends(data_range_permission(LabelTask))):
    """创建标注任务"""
    instance = await get_instance(query_sets, pk)
    await instance.fetch_related("creator")
    instance.stats = {
        "new": await instance.samples.filter(state=LabelTaskSampleStateEnum.NEW).count(),
        "done": await instance.samples.filter(state=LabelTaskSampleStateEnum.DONE).count(),
        "skipped": await instance.samples.filter(state=LabelTaskSampleStateEnum.SKIPPED).count(),
    }
    return instance


@router.patch("/{pk}", summary="修改标注任务", response_model=response.LabelTaskOut)
async def patch_label_task(
    pk: int,
    user: NeedAuthorization,
    items: request.PatchLabelTaskIn,
    query_sets=Depends(data_range_permission(LabelTask)),
):
    """修改标注任务"""
    items = items.model_dump()
    instance = await get_instance(query_sets, pk)
    for key, v in items.items():
        if v is not None:
            setattr(instance, key, v)
    instance.modifier = user
    await instance.save()
    await instance.fetch_related("creator")
    return instance


@router.delete("/{pk}", summary="删除标注任务")
async def delete_label_task(pk: int, query_sets=Depends(data_range_permission(LabelTask))):
    """删除标注任务"""
    instance = await get_instance(query_sets, pk)
    await LabelTaskAttachment.filter(label_task_id=pk).delete()
    await LabelTaskSample.filter(label_task_id=pk).delete()
    await instance.delete()
    return


@router.post("/{pk}/attachments", summary="上传标注任务附件")
async def label_task_attachments(
    pk: int,
    user: NeedAuthorization,
    file: UploadFile,
    dir_name: str | None = Form(default=None),
    query_sets=Depends(data_range_permission(LabelTask)),
) -> dict[str, Any]:
    """上传标注任务附件"""
    instance = await get_instance(query_sets, pk)
    attachment_obj = await LabelTaskAttachment.create(label_task=instance, creator=user)
    filename = file.filename
    path = f"static/labelu/{instance.id}/"
    if dir_name:
        os.makedirs(f"{path}{dir_name}/", exist_ok=True)
    # else:
    attachment_obj.local_file_path = filename
    os.makedirs(path, exist_ok=True)
    async with aiofiles.open(path + filename, "wb") as f:
        await f.write(await file.read())
    attachment_obj.file_path = "/" + path + filename
    await attachment_obj.save()
    return {
        "id": attachment_obj.id,
        "url": attachment_obj.file_path,
        "local_path": attachment_obj.local_file_path,
        "label_task": {
            "id": instance.id,
            "name": instance.name,
        },
    }


@router.delete("/{pk}/bulk-delete-attachments", summary="批量删除附件")
async def delete_label_task_attachments(
    pk: int, query_sets=Depends(data_range_permission(LabelTask)), attachment_ids: list[int] = Body(embed=True)
):
    """删除标注任务附件"""
    await get_instance(query_sets, pk)
    local_file_paths = await LabelTaskAttachment.filter(id__in=attachment_ids).values_list("local_file_path", flat=True)
    for local_file_path in local_file_paths:
        try:
            os.remove(local_file_path)
        except FileNotFoundError:
            pass
    await LabelTaskAttachment.filter(id__in=attachment_ids).delete()
    return


@router.post("/{pk}/samples", summary="附件转为标注样本")
async def create_label_sample(
    pk: int,
    items: request.LabelTaskSampleIn,
    user: NeedAuthorization,
    query_sets=Depends(data_range_permission(LabelTask)),
):
    """附件转为标注样本"""
    label_task = await get_instance(query_sets, pk)
    data = items.model_dump()["items"]
    ids = []
    for d in data:
        sample_obj = await LabelTaskSample.create(
            task_attachment_ids=d["attachement_ids"], data=d["data"], label_task=label_task, creator=user
        )
        ids.append(sample_obj.id)
    if label_task.status == LabelTaskStatusEnum.DRAFT:
        label_task.status = LabelTaskStatusEnum.IMPORTED
        await label_task.save()
    elif label_task.status == LabelTaskStatusEnum.FINISHED:
        label_task.status = LabelTaskStatusEnum.CONFIGURED
        await label_task.save()
    return {"ids": ids}


class NewParams(Params):
    page: int = Query(1, ge=1, description="Page number")
    # 调整最大值范围
    size: int = Query(50, ge=1, le=1000, description="Page size")


@router.get("/{pk}/samples", summary="标注样本列表", response_model=Page[response.LabelTaskSampleOut])
async def label_samples(
    pk: int,
    state: LabelTaskSampleStateEnum | None = None,
    annotated_count: int | None = None,
    params=Depends(NewParams),
    query_sets=Depends(data_range_permission(LabelTask)),
    sample_query_sets=Depends(data_range_permission(LabelTaskSample)),
):
    """标注样本列表"""
    label_task = await get_instance(query_sets, pk)
    query_sets = sample_query_sets.filter(label_task=label_task)
    if state:
        query_sets = query_sets.filter(state=state)
    if annotated_count:
        query_sets = query_sets.filter(annotated_count=annotated_count)
    return await paginate(query_sets, params=params)


@router.get("/{task_id}/samples/{sample_id}", summary="标注样本详情", response_model=response.LabelTaskSampleOut)
async def retrieve_label_sample(
    task_id: int,
    sample_id: int,
    sample_query_sets=Depends(data_range_permission(LabelTaskSample)),
):
    """标注样本列表"""
    try:
        instance = await sample_query_sets.get(label_task_id=task_id, id=sample_id)
    except DoesNotExist:
        raise CommonError.ResourceDoesNotExistError
    return instance


@router.patch("/{task_id}/samples/{sample_id}", summary="修改标注", response_model=response.LabelTaskSampleOut)
async def patch_label_sample(
    task_id: int,
    sample_id: int,
    items: request.PatchLabelTaskSampleIn,
    sample_query_sets=Depends(data_range_permission(LabelTaskSample)),
):
    """修改标注样本"""
    try:
        instance = await sample_query_sets.get(label_task_id=task_id, id=sample_id)
    except DoesNotExist:
        raise CommonError.ResourceDoesNotExistError
    if items.data is not None:
        instance.data = items.data
    for key, v in items.model_dump().items():
        if v is not None:
            setattr(instance, key, v)
    await instance.save()
    label_task = await instance.label_task
    no_label_count = await label_task.samples.filter(state=LabelTaskSampleStateEnum.NEW).count()
    if not no_label_count:
        label_task.status = LabelTaskStatusEnum.FINISHED
    else:
        label_task.status = LabelTaskStatusEnum.INPROGRESS
    await label_task.save()
    return instance


@router.post("/{task_id}/samples/export-to-data-sets", summary="导出到数据集")
async def export_to_datasets(
    task_id: int,
    items: request.LabeluExportDataSetsIn,
    user: NeedAuthorization,
    sample_query_sets=Depends(data_range_permission(LabelTaskSample)),
):
    """标注样本列表"""
    items = items.model_dump()
    sample_ids = items["sample_ids"]
    dataset_group_id = items["dataset_group_id"]
    dataset_group_name = items["dataset_group_name"]
    dataset_group_note = items["dataset_group_note"]
    # todo 查询标注任务, 根据标注任务配置调整导出策略(分类和画框)
    label_task = await get_instance(LabelTask, task_id)
    label_task_config = label_task.config
    tool = ""
    if label_task_config_dict := json.loads(label_task_config):
        tool = label_task_config_dict["tools"][0]["tool"]
    if not tool:
        raise LabelTaskError.ExportDataSetError("数据集导出失败, 未完成标注配置!")
    elif tool == "tagTool":  # 分类
        if dataset_group_id:
            group = await DataSetGroup.filter(id=dataset_group_id).first()
            if group.annotation_type != AnnotationTypeEnum.IMAGE_CLASSIFY:
                raise LabelTaskError.ExportDataSetError
        else:
            group = await DataSetGroup.create(
                name=dataset_group_name, creator=user, annotation_type=AnnotationTypeEnum.IMAGE_CLASSIFY
            )
        # 根据分类标签创建对应目录
        source_dir = f"static/classify/{task_id}"
        options = label_task_config_dict["tools"][0]["config"]["attributes"][0]["options"]
        for option in options:
            os.makedirs(f"{source_dir}/{option['key']}", exist_ok=True)
        # 将对应的图片移动到对应标签目录中
        data = list(
            await sample_query_sets.filter(id__in=sample_ids).values(
                "id", "task_attachment_ids", "annotated_count", "data", "state"
            )
        )
        for d in data:
            if d["state"] != LabelTaskSampleStateEnum.DONE:
                continue
            label_info = d["data"]
            # {
            #     "urls": {
            #         "480": "/static/labelu/36/images/dog.96.jpg"
            #     },
            #     "result": {
            #         "tagTool": {
            #             "result": [
            #                 {
            #                     "id": "USR6zJth",
            #                     "attributes": {
            #                         "tag-label-1": "dog"
            #                     }
            #                 }
            #             ],
            #             "toolName": "tagTool"
            #         }
            #     },
            #     "fileNames": {
            #         "480": "images/dog.96.jpg"
            #     }
            # }
            label = list(label_info["result"]["tagTool"]["result"][0]["attributes"].values())[0]
            for option in options:
                if option["value"] == label:
                    label = option["key"]

            image_path = list(label_info["urls"].values())[0]
            shutil.copy(image_path[1:], f"{source_dir}/{label}")
        # 压缩上传数据集
        output_zip = f"static/classify/label-{task_id}"
        await asyncify(shutil.make_archive)(output_zip, "zip", root_dir=source_dir)

        # 上传到minio
        year_month = get_current_time().strftime("%Y-%m")
        label_task = await LabelTask.get(id=task_id)
        object_name = f"{user.username}/{year_month}/labelu/{label_task.name}-{task_id}.zip"
        await asyncify(minio_client.fupload_file)(object_name, output_zip + ".zip")
        file = await OssFile.create(path=object_name, filename=f"{label_task.name}-{task_id}.zip")
        # 导入到数据集 todo 修改导入类型
        if old_data_set := await DataSet.filter(data_set_group=group).order_by("-version").first():
            version = old_data_set.version + 1
        else:
            version = 1
        await DataSet.create(
            version=version, data_set_group=group, creator=user, description=dataset_group_note, file=file
        )
        # 删除掉压缩包
        try:
            os.remove(output_zip + ".zip")
            shutil.rmtree(source_dir)
        except Exception:
            pass
    elif tool == "rectTool":  # 画框
        if dataset_group_id:
            group = await DataSetGroup.filter(id=dataset_group_id).first()
            if group.annotation_type != AnnotationTypeEnum.OBJECT_DETECTION:
                raise LabelTaskError.ExportDataSetError
        else:
            group = await DataSetGroup.create(name=dataset_group_name, creator=user)
        data = list(
            await sample_query_sets.filter(id__in=sample_ids).values(
                "id", "task_attachment_ids", "annotated_count", "data", "state"
            )
        )
        xml_result = converter.convert(input_data=data, export_type="xml")
        label_dir = f"static/labelu/{task_id}/labels"
        source_dir = f"static/labelu/{task_id}"
        os.makedirs(label_dir, exist_ok=True)
        xml_files = glob.glob(os.path.join(label_dir, "*.xml"))
        # 删除所有xml文件, 可能为上一次标注导出的结果
        for xml_file in xml_files:
            try:
                os.remove(xml_file)
            except Exception:
                pass
        # 写入xml文件
        for xml_str in xml_result:
            if not xml_str:
                continue
            doc = ET.fromstring(xml_str)
            folder = None
            file_name = ""
            doc_folder = doc.find(".//folder")
            doc_filename = doc.find(".//filename")
            if doc_folder is not None:
                folder = doc_folder.text
            if doc_filename is not None:
                file_name = str(doc_filename.text)
            if folder:
                # 文件名中可能存在多个.的情况, 删除最后一段后缀
                split_list = file_name.split(".")
                split_list.pop(-1)
                file_name = ".".join(split_list)
                label_file_path = f"{label_dir}/{folder}-{file_name}.xml"
            else:
                split_list = file_name.split(".")
                split_list.pop(-1)
                file_name = ".".join(split_list)
                label_file_path = f"{label_dir}/{file_name}.xml"
            async with aiofiles.open(label_file_path, "w") as f:
                await f.write(xml_str)
        # 压缩为zip

        output_zip = f"static/labelu/label-{task_id}"
        await asyncify(shutil.make_archive)(output_zip, "zip", root_dir=source_dir)
        # 上传到minio
        year_month = get_current_time().strftime("%Y-%m")
        label_task = await LabelTask.get(id=task_id)
        object_name = f"{user.username}/{year_month}/labelu/{label_task.name}-{task_id}.zip"
        await asyncify(minio_client.fupload_file)(object_name, output_zip + ".zip")
        file = await OssFile.create(path=object_name, filename=f"{label_task.name}-{task_id}.zip")
        # 导入到数据集
        if old_data_set := await DataSet.filter(data_set_group=group).order_by("-version").first():
            version = old_data_set.version + 1
        else:
            version = 1
        await DataSet.create(
            version=version, data_set_group=group, creator=user, description=dataset_group_note, file=file
        )
        # 删除掉压缩包
        try:
            os.remove(output_zip + ".zip")
        except Exception:
            pass
    return
