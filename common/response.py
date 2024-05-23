import datetime
import json
import typing

from fastapi import UploadFile
from fastapi.responses import JSONResponse

from conf.settings import settings


class MyJsonEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, UploadFile):
            return o.filename
        if isinstance(o, datetime.datetime):
            return o.strftime(settings.DATETIME_FORMAT)


class MyJSONResponse(JSONResponse):
    media_type = "application/json"

    def __init__(
        self,
        content: typing.Any,
        status_code: int = 200,
        headers: dict[str, str] | None = None,
        media_type: str | None = None,
        background: typing.Any = None,
    ) -> None:
        super().__init__(content, status_code, headers, media_type, background)

    def render(self, content: typing.Any) -> bytes:
        return json.dumps(
            content,
            ensure_ascii=False,
            allow_nan=False,
            indent=None,
            separators=(",", ":"),
            cls=MyJsonEncoder,
        ).encode("utf-8")


class CustomJSONResponse(MyJSONResponse):
    """成功响应"""

    def __init__(
        self,
        content: typing.Any = None,
        status_code: int = 200,
        headers: dict[str, str] | None = None,
        media_type: str | None = None,
        background: typing.Any = None,
    ) -> None:
        if content is not None:
            content = {"code": "200", "msg": "成功!", "details": content}
        else:
            content = {
                "code": "200",
                "msg": "成功!",
            }
        super().__init__(
            content=content,
            status_code=status_code,
            headers=headers,
            media_type=media_type,
            background=background,
        )
