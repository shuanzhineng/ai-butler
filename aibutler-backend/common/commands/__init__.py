from tortoise import Tortoise

from apps.system.models.db import User
from apps.system.models.db import Menu, MenuAPIPermission
from common.const_menu import INIT_MENU
from conf.settings import AERICH_TORTOISE_ORM_CONFIG
from loguru import logger


async def init_tortoise():
    await Tortoise.init(config=AERICH_TORTOISE_ORM_CONFIG)


async def create_user(username: str, password: str) -> None:
    await init_tortoise()
    await User.create_user(username=username, password=password, is_superuser=True)
    logger.info("User added!")


async def _create_menus(menus, parent=None):
    for menu_dict in menus:
        apis = menu_dict.pop("apis", [])
        children = menu_dict.pop("children", [])
        obj = await Menu.create(**menu_dict, parent=parent)
        bulk_apis = []
        for api in apis:
            api["menu"] = obj
            bulk_apis.append(MenuAPIPermission(**api))
        await MenuAPIPermission.bulk_create(bulk_apis)
        await _create_menus(children, parent=obj)


async def create_menus() -> None:
    await init_tortoise()
    await _create_menus(INIT_MENU)
