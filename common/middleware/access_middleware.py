from collections.abc import Callable
from datetime import datetime
from typing import Any

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from common.logger import logger


class AccessMiddleware(BaseHTTPMiddleware):
    """
    记录请求日志
    """

    async def dispatch(self, request: Request, call_next: Callable[[Any], Any]) -> Any:
        start_time = datetime.now()
        logger.info(f"{request.method} {request.url} start")
        response = await call_next(request)
        end_time = datetime.now()
        # 用时 单位秒
        use_time = (end_time - start_time).total_seconds()
        logger.info(f"{request.method} {request.url} {use_time} end")
        return response
