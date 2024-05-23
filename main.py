import uvicorn
from fastapi import FastAPI

from common.lifespan import lifespan
from common.middleware import register_middleware
from common.exceptions.handler import register_custom_exception
from conf.routers import register_router
from common.response import CustomJSONResponse


def create_app() -> FastAPI:
    _app = FastAPI(
        default_response_class=CustomJSONResponse,
        lifespan=lifespan,
        # docs_url=None,  # 关闭自带的文档
        redoc_url=None,
    )
    # 注册中间件
    register_middleware(_app)
    # 注册路由
    register_router(_app)
    # 注册自定义异常处理
    register_custom_exception(_app)
    return _app


app = create_app()

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
