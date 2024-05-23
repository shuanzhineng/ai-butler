from typing import Annotated

from fastapi import APIRouter, Form

from apps.account.models import response
from common.authentication import (
    authenticate_user,
    create_token,
    refresh_token_to_access_token,
)
from common.custom_route import CustomRoute
from common.utils import construct_tree
from common.depends import NeedAuthorization
from apps.system.models.db import Menu
from apps.system.models import response as system_response


router = APIRouter(
    prefix="/account", tags=["认证信息"], responses={404: {"description": "Not found"}}, route_class=CustomRoute
)


@router.post("/oauth2/token", response_model=response.Token, summary="获取访问token")
async def get_access_token(
    username: Annotated[str, Form()],
    password: Annotated[str, Form()],
) -> dict[str, str]:
    user = await authenticate_user(username, password)
    output = create_token(data={"user_id": user.id})
    return output


@router.post("/oauth2/refresh_token", response_model=response.Token, summary="刷新访问token")
async def _refresh_token(refresh_token: str) -> dict[str, str]:
    """刷新token"""
    return refresh_token_to_access_token(refresh_token)


@router.get("/user-menus", summary="用户展示的菜单树", response_model=list[system_response.QueryMenuTreeOut])
async def user_menu_tree(user: NeedAuthorization):
    """完整菜单树"""
    roles = await user.roles.all()
    if not roles and not user.is_superuser:
        return []
    elif user.is_superuser:
        menus = await Menu.all()
        tree = construct_tree(menus)
    else:
        # 将多个角色的菜单进行合并
        menu_ids = []
        for role in roles:
            menu_ids.extend(list(await role.menus.all().values_list("id", flat=True)))
        menu_ids = list(set(menu_ids))
        menus = await Menu.filter(id__in=menu_ids)
        tree = construct_tree(menus)
    output = []
    for obj in tree:
        result = dict(await system_response.QueryMenuTreeOut.from_tortoise_orm(obj))
        output.append(result)
    return output
