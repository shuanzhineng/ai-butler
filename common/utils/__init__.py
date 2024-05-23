from datetime import datetime

import pytz
from passlib.context import CryptContext

from conf.settings import settings
from common.db import DBBaseModel
from common.exceptions import CommonError
from tortoise.exceptions import DoesNotExist
from typing import Type, TypeVar

MODEL = TypeVar("MODEL", bound=DBBaseModel)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
global_timezone = pytz.timezone(settings.TIMEZONE)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码是否正确"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """获取密码hash值"""
    return pwd_context.hash(password)


def get_current_time() -> datetime:
    """获取当前时间"""
    return datetime.now(global_timezone)


async def get_instance(model: Type[MODEL], pk: int) -> MODEL:
    """数据存在校验"""
    try:
        instance = await model.get(id=pk)
    except DoesNotExist:
        raise CommonError.ResourceDoesNotExistError
    else:
        return instance


def construct_tree(items: list[MODEL]) -> list[MODEL]:
    """构造树"""
    item_dict = {item.id: item for item in items}

    # 遍历菜单项，构建菜单树
    for menu in items:
        if menu.parent_id and menu.parent_id in item_dict:
            parent_menu = item_dict[menu.parent_id]
            if not hasattr(parent_menu, "children"):
                parent_menu.children = []
            parent_menu.children.append(menu)

    # 过滤出顶级菜单（即没有父菜单的菜单项）
    top_level_menus = [item for item in items if not item.parent_id]
    return top_level_menus
