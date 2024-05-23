from common.base_pydantic import CustomBaseModel
from pydantic import Field, field_validator

from typing_extensions import TypedDict
from typing import Literal
from common.enums import MenuGenreEnum, DataScopeEnum


class CreateMenuIn(CustomBaseModel):
    """创建菜单请求体参数"""

    name: str = Field(min_length=1, max_length=30)
    code: str = Field(min_length=1, max_length=100)
    icon: str = Field(min_length=0, max_length=30)
    web_path: str = Field(min_length=0, max_length=255, default="")
    sort: int = Field(ge=0)
    is_link: bool = False
    disabled: bool = False
    link_url: str = Field(min_length=0, max_length=255, default="")
    genre: MenuGenreEnum
    parent_id: int | None = None


class API(TypedDict):
    method: Literal["GET", "POST", "PUT", "PATCH", "DELETE"]
    api: str


class CreateButtonIn(CustomBaseModel):
    name: str = Field(min_length=1, max_length=30)
    code: str = Field(min_length=1, max_length=100)
    sort: int = Field(ge=0)
    parent_id: int | None = None
    disabled: bool = False
    apis: list[API] = []


class CreateRoleIn(CustomBaseModel):
    """创建角色请求体参数"""

    name: str = Field(min_length=1, max_length=30)
    code: str = Field(min_length=0, max_length=30)
    disabled: bool = False
    sort: int = Field(ge=0)
    description: str = Field(min_length=0, max_length=200, default="")


class PutRoleIn(CustomBaseModel):
    """修改角色请求体参数"""

    data_range: DataScopeEnum
    dept_ids: list[int] = []
    menu_ids: list[int]

    @field_validator("dept_ids")
    @classmethod
    def validate_data_range(cls, v, values):
        if not v and values.data["data_range"] == DataScopeEnum.CUSTOM:
            raise ValueError("自定数据权限时 dept_ids 不能为空")
        return v


class CreateDeptIn(CustomBaseModel):
    """创建部门请求体参数"""

    name: str = Field(min_length=1, max_length=30)
    code: str = Field(min_length=0, max_length=30, default="")
    owner: str = Field(min_length=1, max_length=30)
    phone: str = Field(min_length=11, max_length=11, pattern=r"^1\d{10}$")
    email: str = Field(min_length=5, max_length=255, pattern=r"[^@]+@[^@]+\.[^@]+", examples=["123@qq.com"])
    disabled: bool = False
    sort: int = Field(ge=0, default=1)
    description: str = Field(min_length=0, max_length=200, default="")
    parent_id: int | None = None


class PutUserIn(CustomBaseModel):
    """创建用户请求体参数"""

    name: str = Field(min_length=0, max_length=30)
    username: str = Field(min_length=5, max_length=30)
    phone: str = Field(min_length=11, max_length=11, pattern=r"^1\d{10}$")
    email: str = Field(min_length=5, max_length=255, pattern=r"[^@]+@[^@]+\.[^@]+", examples=["123@qq.com"])
    disabled: bool = False
    description: str = Field(min_length=0, max_length=200, default="")
    role_ids: list[int]
    dept_ids: list[int]


class CreateUserIn(PutUserIn):
    """创建用户请求体参数"""

    password: str = Field(min_length=8, max_length=30)


class ChangePasswordIn(CustomBaseModel):
    password: str = Field(min_length=8, max_length=30)
    password2: str = Field(min_length=8, max_length=30)

    @field_validator("password2")
    @classmethod
    def validate_password(cls, v, values):
        password = values.data["password"]
        if v != password:
            raise ValueError("两次输入的密码不一致!")
        return v


class CeleryWorkerOnlineIn(CustomBaseModel):
    name: str
    listen_queue: str
    concurrency: int
    is_online: bool = True
    ip_address: str = ""
    available_ports: list = []


class CeleryWorkerOfflineIn(CustomBaseModel):
    name: str
