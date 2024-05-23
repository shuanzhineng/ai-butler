from fastapi import APIRouter, Depends
from apps.system.models.db import Menu, Role, Dept
from apps.system.models import request, response
from common.depends import NeedAuthorization, data_range_permission
from common.utils import get_instance
from fastapi_pagination import Page, Params
from http import HTTPStatus
from tortoise.transactions import atomic
from fastapi_pagination.ext.tortoise import paginate
from common.custom_route import CustomRoute
from tortoise.expressions import Q


router = APIRouter(
    prefix="/roles", tags=["角色管理"], responses={404: {"description": "Not found"}}, route_class=CustomRoute
)


@router.get("", summary="角色列表", response_model=Page[response.RoleOut])
async def roles(
    query_sets=Depends(data_range_permission(Role)),
    keyword: str = "",
    name: str = "",
    disabled: bool | None = None,
    params=Depends(Params),
):
    """角色列表"""
    if keyword:
        query_sets = query_sets.filter(
            Q(name__icontains=keyword) | Q(code__icontains=keyword) | Q(description__icontains=keyword)
        )
    if name:
        query_sets = query_sets.filter(name=name)
    if disabled is not None:
        query_sets = query_sets.filter(disabled=disabled)
    return await paginate(query_sets, params=params)


@router.get("/{pk}", summary="角色详情", response_model=response.RoleDetailsOut)
async def retrieve_role(pk: int, query_sets=Depends(data_range_permission(Role))):
    """角色详情"""
    instance = await get_instance(query_sets, pk)
    menus = await instance.menus
    depts = await instance.depts
    instance.menu_ids = [m.id for m in menus]
    instance.dept_ids = [m.id for m in depts]
    return instance


@router.post("", summary="创建角色", response_model=response.RoleOut, status_code=HTTPStatus.CREATED)
async def create_role(user: NeedAuthorization, items: request.CreateRoleIn):
    """创建角色"""
    role = await Role.create(**items.model_dump(), creator=user)
    return role


@router.put("/{pk}", summary="修改角色", response_model=response.RoleOut)
async def put_role(pk: int, items: request.CreateRoleIn, query_sets=Depends(data_range_permission(Role))):
    """修改角色"""
    instance = await get_instance(query_sets, pk)
    await query_sets.filter(id=instance.id).update(**items.model_dump())
    return instance


@router.put("/{pk}/permission", summary="修改角色权限")
async def put_role_permission(pk: int, items: request.PutRoleIn, query_sets=Depends(data_range_permission(Role))):
    """修改角色权限"""
    instance = await get_instance(query_sets, pk)
    items = items.model_dump()

    @atomic()
    async def _patch():
        instance.data_range = items["data_range"]
        await instance.save()
        menu_ids = items["menu_ids"]
        dept_ids = items["dept_ids"]

        menu_objs = await Menu.filter(id__in=menu_ids)
        dept_objs = await Dept.filter(id__in=dept_ids)

        await instance.menus.clear()
        await instance.depts.clear()
        await instance.menus.add(*menu_objs)
        await instance.depts.add(*dept_objs)

    await _patch()
    return


@router.delete("/{pk}", summary="删除角色")
async def delete_role(pk: int, query_sets=Depends(data_range_permission(Role))):
    """删除角色"""
    instance = await get_instance(query_sets, pk)
    await instance.delete()
    return
