from collections.abc import Callable
from datetime import datetime
from typing import Any
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from common.logger import logger


class AccessLogMiddleware(BaseHTTPMiddleware):
    """
    记录请求日志
    """

    async def dispatch(self, request: Request, call_next: Callable[[Any], Any]) -> Any:
        """
        遇到bug无法正常获取request.body(), 参考下方issue
        https://github.com/tiangolo/fastapi/issues/394
        FastAPI 0.108.0中完成了修复
        2024/2/28 暂时放弃在中间件中记录日志, 目前中间件中无法获取响应正文

        将使用自定义router的方式来进行日志记录
        """
        start_time = datetime.now()
        logger.info(f"{request.method} {request.url} start")
        # request_body = await request.body()

        response = await call_next(request)
        # response_body = response.body
        # response_body = response.status_code
        end_time = datetime.now()
        # 用时 单位秒
        use_time = (end_time - start_time).total_seconds()
        # await AccessLog.create(
        #     api=request.url.path,
        #     method=request.method,
        #     ip_address=request.method,
        #     browser=request.method,
        #     http_status_code=response.status_code,
        #     request_body=request_body,
        #     response_body=response.body,
        # )
        logger.info(f"{request.method} {request.url} {use_time} end")
        return response
