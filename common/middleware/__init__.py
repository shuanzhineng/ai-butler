from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from common.middleware.access_log_middleware import AccessLogMiddleware
from conf.settings import settings


def register_middleware(app: FastAPI) -> None:
    # 跨域
    if settings.MIDDLEWARE_CORS:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.ALLOW_ORIGINS,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    app.add_middleware(GZipMiddleware)
    app.add_middleware(AccessLogMiddleware)
