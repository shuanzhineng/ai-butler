from datetime import datetime

from common.base_pydantic import CustomBaseModel as BaseModel


class Token(BaseModel):
    access_token: str
    refresh_token: str | None = None
    expires_in: datetime
