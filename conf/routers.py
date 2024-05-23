from fastapi import FastAPI
from apps.api import router, router2
from conf.settings import settings


def register_router(app: FastAPI) -> None:
    # 添加路由蓝图
    if settings.SERVICE_TYPE == "OBJECT_DETECTION":
        app.include_router(router)
    else:
        app.include_router(router2)
