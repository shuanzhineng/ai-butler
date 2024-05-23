from fastapi import Request
from conf.settings import settings
from common.exceptions import CommonError
from fastapi.security import HTTPBearer


class TokenAuthorization(HTTPBearer):
    async def __call__(self, request: Request) -> None:
        authorization = request.headers.get("Authorization")
        if authorization != f"Bearer {settings.AUTHENTICATION_TOKEN}":
            raise CommonError.InvalidTokenError
        return
