import uvicorn
from fastapi import FastAPI

from common.exceptions.handler import register_custom_exception
from common.middleware import register_middleware
from common.response import CustomJSONResponse
from common.lifespan import lifespan
from conf.routers import register_router
from conf.settings import settings
from fastapi_pagination import add_pagination
from common.db_signal import registration_db_signal


def create_app() -> FastAPI:
    _app = FastAPI(
        # 修改默认响应类, 响应中增加code, msg
        default_response_class=CustomJSONResponse,
        lifespan=lifespan,
        # docs_url=None,  # 关闭自带的文档
        redoc_url=None,
    )

    # 初始化tortoise-orm
    registration_db_signal()
    # 注册中间件
    register_middleware(_app)
    # 注册路由
    register_router(_app)
    # 注册自定义异常处理
    register_custom_exception(_app)
    # https://github.com/uriyyo/fastapi-pagination 分页器用法
    add_pagination(_app)

    # 开启静态目录
    if settings.STATIC_FILE:
        from fastapi.staticfiles import StaticFiles

        _app.mount(
            settings.STATIC_PATH,
            StaticFiles(directory=settings.STATIC_DIR),
            name="static",
        )
    return _app


app = create_app()

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, workers=2)
