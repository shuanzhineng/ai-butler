from fastapi.routing import APIRoute
from typing import Callable
from fastapi import Response, Request
from apps.system.models.db import AccessLog, LoginLog
from ua_parser.user_agent_parser import Parse

from fastapi.security.utils import get_authorization_scheme_param
from jose import jwt

from apps.system.models.db import User
from conf.settings import settings
import re

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM

AUTH_USER_MODEL = User
LOGIN_PATH = "/account/oauth2/token"
NO_LOG_PATHS: list[str] = [
    r"/account/oauth2/token",
    r"/data/label-tasks/\d+?/attachments",
    r"/static/.*",
    r"/ai-models/train-task-groups/train-tasks/\d+?/status",
    r"/system/celery-workers/online",
    r"/system/celery-workers/offline",
    r"/applications/deploy-online-infers/\d+?/by-worker",
]  # 登录接口和涉及文件上传和下载的接口不记录日志


class CustomRoute(APIRoute):
    """自定义路由处理"""

    def get_route_handler(self) -> Callable:
        original_route_handler = super().get_route_handler()

        async def custom_route_handler(request: Request) -> Response:
            response: Response = await original_route_handler(request)
            response_body = response.body
            raw_user_agent = request.headers["user-agent"]
            parsed_user_agent = Parse(raw_user_agent)
            user_agent = parsed_user_agent["user_agent"]
            os_info = parsed_user_agent["os"]
            browser = ""
            os = ""
            if family := user_agent.get("family"):
                major = user_agent.get("major") or ""
                minor = user_agent.get("minor") or ""
                patch = user_agent.get("patch") or ""
                browser = f"{family} {major}.{minor}.{patch}"
            if family := os_info.get("family"):
                major = os_info.get("major") or ""
                minor = os_info.get("minor") or ""
                patch = os_info.get("patch") or ""
                os = f"{family} {major}.{minor}.{patch}"

            if request.url.path == LOGIN_PATH:
                request_form = dict(await request.form())
                await LoginLog.create(
                    username=request_form["username"],
                    ip_address=request.client.host,
                    browser=browser,
                    os=os,
                    user_agent=raw_user_agent,
                    http_status_code=response.status_code,
                    is_success=True if response.status_code == 200 else False,
                )
            for no_log_path in NO_LOG_PATHS:
                if re.findall(no_log_path, request.url.path):
                    return response
            # 不记录get和options
            if request.method in ["GET", "OPTIONS"]:
                return response
            # 记录访问日志
            request_body: bytes = await request.body()
            # 提取操作人
            authorization = request.headers.get("Authorization")
            _, token = get_authorization_scheme_param(authorization)
            user = None
            if token:
                payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                user_id = payload.get("user_id")
                user = await User.filter(id=user_id).first()
            if request.url.query:
                api = request.url.path + "?" + request.url.query
            else:
                api = request.url.path
            await AccessLog.create(
                api=api,
                method=request.method,
                ip_address=request.client.host,
                browser=browser,
                os=os,
                user_agent=raw_user_agent,
                http_status_code=response.status_code,
                request_body=request_body.decode(),
                response_body=response_body.decode(),
                creator=user,
            )
            return response

        return custom_route_handler
