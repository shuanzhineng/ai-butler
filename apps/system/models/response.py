from common.base_pydantic import CreatorOut, custom_base_model_config
from pydantic import field_validator
from typing import Literal
from typing_extensions import TypedDict
from apps.system.models.db import Menu, Role, Dept, User, LoginLog, AccessLog
from common.enums import MenuGenreEnum, DataScopeEnum
from tortoise.contrib.pydantic.creator import pydantic_model_creator

# ---------------------菜单model------------------------
_MenuNoParentOut = pydantic_model_creator(
    Menu, name="_MenuNoParentOut", exclude=("parent",), model_config=custom_base_model_config
)


_ButtonNoParentOut = pydantic_model_creator(
    Menu,
    name="_ButtonNoParentOut",
    include=(
        "id",
        "name",
        "code",
        "sort",
        "disabled",
    ),
    model_config=custom_base_model_config,
)


class MenuNoParentOut(_MenuNoParentOut):  # type: ignore
    genre: dict[str, str] | str

    @field_validator(
        "genre",
    )
    @classmethod
    def change_genre(cls, v):
        if not isinstance(v, dict):
            return {"name": MenuGenreEnum.get_display(v), "value": v}
        return v


class MenuDetailOut(MenuNoParentOut):
    """创建菜单响应体参数"""

    parent_id: int | None = None


class QueryMenuOut(MenuNoParentOut):
    """查询菜单响应体参数"""

    parent_id: str | int | None
    child: bool = False


class QueryMenuTreeOut(MenuNoParentOut):
    """查询菜单树响应体参数"""

    parent_id: str | int | None
    children: list["QueryMenuTreeOut"] = []


class QueryButtonOut(_ButtonNoParentOut):  # type: ignore
    """查询菜单响应体参数"""

    class API(TypedDict):
        method: Literal["GET", "POST", "PUT", "PATCH", "DELETE"]
        api: str

    apis: list[API] = []


# ---------------------角色model------------------------

_RoleOut = pydantic_model_creator(Role, name="_RoleOut", model_config=custom_base_model_config)


class RoleOut(_RoleOut):  # type: ignore
    data_range: dict[str, str | int] | int

    @field_validator(
        "data_range",
    )
    @classmethod
    def change_genre(cls, v):
        if not isinstance(v, dict):
            return {"name": DataScopeEnum.get_display(v), "value": v}
        return v


class RoleDetailsOut(_RoleOut):  # type: ignore
    data_range: dict[str, str | int] | int
    menu_ids: list = []
    dept_ids: list = []

    @field_validator(
        "data_range",
    )
    @classmethod
    def change_genre(cls, v):
        if not isinstance(v, dict):
            return {"name": DataScopeEnum.get_display(v), "value": v}
        return v


# ---------------------部门model------------------------

_DeptNoParentOut = pydantic_model_creator(
    Dept, name="_DeptNoParentOut", allow_cycles=True, exclude=("parent",), model_config=custom_base_model_config
)


class DeptNoParentOut(_DeptNoParentOut):  # type: ignore
    pass


class QueryDeptOut(DeptNoParentOut):
    """查询菜单响应体参数"""

    parent_id: str | int | None
    child: bool = False


class DeptDetailOut(DeptNoParentOut):
    parent_id: int | None = None


class QueryDeptTreeOut(DeptNoParentOut):
    """查询菜单树响应体参数"""

    parent_id: str | int | None
    children: list["QueryDeptTreeOut"] = []


# ---------------------用户model------------------------

_UserOut = pydantic_model_creator(User, name="_UserOut", exclude=("password",), model_config=custom_base_model_config)


class UserOut(_UserOut):  # type: ignore
    roles: list[RoleOut] = []
    depts: list[DeptNoParentOut] = []


# ---------------------日志model------------------------

_LoginLogOut = pydantic_model_creator(LoginLog, name="_LoginLogOut", model_config=custom_base_model_config)


class LoginLogOut(_LoginLogOut):  # type: ignore
    pass


_AccessLogOut = pydantic_model_creator(AccessLog, name="_AccessLogOut", model_config=custom_base_model_config)


class AccessLogOut(_AccessLogOut):  # type: ignore
    creator: CreatorOut | None = None
