from fastapi import FastAPI

from apps.account.apis import router as account_router
from apps.system.apis import router as system_router
from apps.data.apis import router as data_router
from apps.ai_model.apis import router as ai_model_router
from apps.application.apis import router as application_router


def register_router(app: FastAPI) -> None:
    # 添加路由蓝图
    app.include_router(account_router)
    app.include_router(system_router)
    app.include_router(data_router)
    app.include_router(ai_model_router)
    app.include_router(application_router)
