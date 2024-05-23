from common.base_pydantic import BaseModel


class LoginFormData(BaseModel):
    username: str
    password: str