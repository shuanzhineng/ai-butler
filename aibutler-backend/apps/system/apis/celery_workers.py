from fastapi import APIRouter, Depends
from apps.system.models.db import CeleryWorker
from common.custom_route import CustomRoute
from common.depends import inner_authentication
from apps.system.models import request

router = APIRouter(
    prefix="/celery-workers",
    tags=["worker管理"],
    responses={404: {"description": "Not found"}},
    route_class=CustomRoute,
)


@router.get("/healthcheck", summary="健康检查")
async def healthcheck():
    """服务端健康检查"""
    return


@router.post("/online", summary="worker上线", dependencies=[Depends(inner_authentication)])
async def online(items: request.CeleryWorkerOnlineIn):
    """上报worker上线"""
    worker_obj = await CeleryWorker.filter(name=items.name).first()
    if worker_obj:
        for k, v in items.model_dump().items():
            setattr(worker_obj, k, v)
        await worker_obj.save()
    else:
        await CeleryWorker.create(**items.model_dump())
    return


@router.post("/offline", summary="worker下线", dependencies=[Depends(inner_authentication)])
async def offline(items: request.CeleryWorkerOfflineIn):
    """上报worker下线"""
    # 直接删除设备
    await CeleryWorker.filter(**items.model_dump()).delete()
    return
