from fastapi import APIRouter, Depends
from apps.system.models.db import Menu, MenuAPIPermission
from apps.system.models import request, response
from common.depends import NeedAuthorization, data_range_permission
from common.utils import get_instance, construct_tree
from common.enums import MenuGenreEnum
from fastapi_pagination import Page, Params
from http import HTTPStatus
from tortoise.transactions import atomic
from fastapi_pagination.ext.tortoise import paginate
from common.custom_route import CustomRoute


router = APIRouter(
    prefix="/menus", tags=["菜单管理"], responses={404: {"description": "Not found"}}, route_class=CustomRoute
)


@router.get("", summary="菜单列表", response_model=Page[response.QueryMenuOut])
async def menus(params=Depends(Params), parent_id: str | None = None, query_sets=Depends(data_range_permission(Menu))):
    """index"""
    if not parent_id:
        parent_id = None
    query_sets = query_sets.filter(parent=parent_id, genre__in=[MenuGenreEnum.DIRECTORY, MenuGenreEnum.PAGE])
    output = await paginate(query_sets, params=params)
    # 在分页结果中修改child
    for obj in output.items:
        hava_child = bool(await query_sets.filter(parent=obj.id))
        obj.child = hava_child
    return output


@router.get("/full-tree", summary="菜单树", response_model=list[response.QueryMenuTreeOut])
async def menu_tree(query_sets=Depends(data_range_permission(Menu)), no_button: bool = False):
    """完整菜单树"""
    if no_button:
        query_sets = await query_sets.exclude(genre=MenuGenreEnum.BUTTON).prefetch_related("parent")
    else:
        query_sets = await query_sets.prefetch_related("parent")
    tree = construct_tree(query_sets)
    output = []
    for obj in tree:
        result = dict(await response.QueryMenuTreeOut.from_tortoise_orm(obj))
        output.append(result)
    return output


@router.get("/{pk}/buttons", summary="菜单按钮", response_model=Page[response.QueryButtonOut])
async def buttons(pk: int, query_sets=Depends(data_range_permission(Menu)), params=Depends(Params)):
    """菜单下的按钮"""
    query_sets = query_sets.filter(parent=pk, genre=MenuGenreEnum.BUTTON)
    output = await paginate(query_sets, params=params)
    for obj in output.items:
        menu = await query_sets.get(pk=obj.id)
        obj.apis = list(await menu.api_perms.all().values("method", "api"))
    return output


@router.post("/buttons", summary="新增按钮", response_model=response.QueryButtonOut)
async def create_button(items: request.CreateButtonIn, user: NeedAuthorization):
    """创建按钮"""
    items = items.model_dump()

    @atomic()
    async def _create():
        apis = items.pop("apis")
        parent_id = items.pop("parent_id")
        parent = await Menu.filter(id=parent_id).first()
        items["modifier"] = user
        instance = await Menu.create(**items, parent=parent, genre=MenuGenreEnum.BUTTON)

        bulk_data = []
        for api in apis:
            bulk_data.append(MenuAPIPermission(**api, menu=instance))
        await MenuAPIPermission.bulk_create(bulk_data)
        api_perms = await instance.api_perms.all()
        _output = dict(await response.QueryButtonOut.from_tortoise_orm(instance))
        apis = [{"method": api_perm.method.value, "api": api_perm.api} for api_perm in api_perms]
        _output["apis"] = apis
        return _output

    output = await _create()
    return output


@router.put("/buttons/{pk}", summary="修改按钮", response_model=response.QueryButtonOut)
async def put_button(
    pk: int, items: request.CreateButtonIn, user: NeedAuthorization, query_sets=Depends(data_range_permission(Menu))
):
    """修改按钮"""
    instance = await get_instance(query_sets, pk)
    items = items.model_dump()

    @atomic()
    async def _patch():
        nonlocal instance
        apis = items.pop("apis")
        items.pop("parent_id")
        items["modifier"] = user
        await query_sets.filter(id=instance.id).update(**items)
        api_perms = await instance.api_perms.all()
        for api_perm in api_perms:
            await api_perm.delete()
        bulk_data = []
        for api in apis:
            bulk_data.append(MenuAPIPermission(**api, menu=instance))
        await MenuAPIPermission.bulk_create(bulk_data)
        instance = await get_instance(query_sets, pk)
        output = dict(await response.QueryButtonOut.from_tortoise_orm(instance))
        apis = [{"method": api_perm.method.value, "api": api_perm.api} for api_perm in api_perms]
        output["apis"] = apis
        return output

    output = await _patch()
    return output


@router.delete("/buttons/{pk}", summary="删除按钮")
async def delete_button(pk: int, query_sets=Depends(data_range_permission(Menu))):
    """删除按钮"""
    instance = await get_instance(query_sets, pk)

    @atomic()
    async def _delete():
        nonlocal instance
        api_perms = await instance.api_perms.all()
        for api_perm in api_perms:
            await api_perm.delete()
        await instance.delete()

    await _delete()
    return


@router.get("/{pk}", summary="菜单详情", response_model=response.MenuDetailOut)
async def retrieve_menu(pk: int, query_sets=Depends(data_range_permission(Menu))):
    """查看菜单详情"""
    instance = await get_instance(query_sets, pk)
    return instance


@router.post("", summary="创建菜单", response_model=response.MenuDetailOut, status_code=HTTPStatus.CREATED)
async def create_menu(user: NeedAuthorization, items: request.CreateMenuIn):
    """创建菜单"""
    instance = await Menu.create(**items.model_dump(), creator=user)
    return instance


@router.put("/{pk}", summary="修改菜单", response_model=response.MenuDetailOut)
async def put_menu(
    pk: int, user: NeedAuthorization, items: request.CreateMenuIn, query_sets=Depends(data_range_permission(Menu))
):
    """修改菜单"""
    instance = await get_instance(query_sets, pk)
    items = items.model_dump()
    items["modifier"] = user
    parent_id = items.pop("parent_id")
    parent = await query_sets.filter(id=parent_id).first()
    if parent:
        parent = parent.id
    await query_sets.filter(id=instance.id).update(**items, parent_id=parent)
    instance = await query_sets.get(id=pk)
    return instance


@router.delete("/{pk}", summary="删除菜单")
async def delete_menu(pk: int, query_sets=Depends(data_range_permission(Menu))):
    """删除菜单"""
    instance = await get_instance(query_sets, pk)
    await query_sets.filter(parent=instance).update(parent_id=None)
    await instance.delete()
    return
