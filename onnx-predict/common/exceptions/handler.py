from typing import Any

from fastapi import FastAPI
from fastapi.exceptions import (
    HTTPException,
    RequestValidationError,
    ResponseValidationError,
)
from loguru import logger

from common.response import MyJSONResponse


class CustomException(Exception):
    """自定义异常基类"""

    status_code = 500
    default_detail = "A server error occurred."
    default_code = "500"

    def __init__(self, detail: str | None = None) -> None:
        self.detail = detail or self.default_detail

    def __str__(self) -> str:
        return str(self.detail)


def register_custom_exception(app: FastAPI) -> None:
    @app.exception_handler(CustomException)
    async def custom_exception_handler(_: Any, exc: CustomException) -> MyJSONResponse:
        """自定义异常返回响应统一处理器"""
        logger.info(exc)
        return MyJSONResponse(
            status_code=exc.status_code,
            content={"msg": str(exc), "code": exc.default_code},
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(_: Any, exc: HTTPException) -> MyJSONResponse:
        """HTTPException异常返回响应统一处理器"""
        logger.info(exc)
        return MyJSONResponse(
            status_code=exc.status_code,
            content={"msg": exc.detail, "code": "10001"},
        )

    @app.exception_handler(ResponseValidationError)
    async def validation_exception_handler(_: Any, exc: ResponseValidationError) -> MyJSONResponse:
        """BaseModel的ValidationError异常返回响应统一处理器"""
        logger.info(exc)
        return MyJSONResponse(
            status_code=400,
            content={
                "code": "41000",
                "msg": "参数校验错误",
                "detail": exc.errors(),
                "body": exc.body,
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler2(_: Any, exc: RequestValidationError) -> MyJSONResponse:
        """自定义异常返回响应统一处理器"""
        logger.info(exc)
        return MyJSONResponse(
            status_code=400,
            content={
                "code": "41000",
                "msg": "参数校验错误",
                "detail": exc.errors(),
                "body": exc.body,
            },
        )
