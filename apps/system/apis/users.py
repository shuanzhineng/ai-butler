from fastapi import APIRouter, Depends
from apps.system.models.db import Role, Dept, User
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
    prefix="/users", tags=["用户管理"], responses={404: {"description": "Not found"}}, route_class=CustomRoute
)


@router.get("", summary="用户列表", response_model=Page[response.UserOut])
async def users(
    query_sets=Depends(data_range_permission(User)),
    keyword: str = "",
    disabled: bool | None = None,
    params=Depends(Params),
):
    """用户列表"""
    if keyword:
        query_sets = query_sets.filter(
            Q(name__icontains=keyword)
            | Q(username__icontains=keyword)
            | Q(phone__icontains=keyword)
            | Q(email__icontains=keyword)
            | Q(description__icontains=keyword)
        )
    if disabled is not None:
        query_sets = query_sets.filter(disabled=disabled)
    query_sets = query_sets.prefetch_related("roles", "depts")
    return await paginate(query_sets, params=params)


@router.get("/{pk}", summary="用户详情", response_model=response.UserOut)
async def retrieve_role(pk: int, query_sets=Depends(data_range_permission(User))):
    """角色详情"""
    instance = await get_instance(query_sets, pk)
    await instance.fetch_related("roles", "depts")
    return instance


@router.post("", summary="创建用户", response_model=response.UserOut, status_code=HTTPStatus.CREATED)
async def create_user(user: NeedAuthorization, items: request.CreateUserIn):
    """创建用户"""
    items = items.model_dump()
    role_ids = items.pop("role_ids")
    dept_ids = items.pop("dept_ids")
    password = items.pop("password")
    username = items.pop("username")
    roles = await Role.filter(id__in=role_ids)
    depts = await Dept.filter(id__in=dept_ids)
    instance = await User.create_user(username, password, **items, creator=user)
    await instance.roles.add(*roles)
    await instance.depts.add(*depts)
    await instance.fetch_related("roles", "depts")
    return instance


@router.put("/{pk}", summary="修改用户信息", response_model=response.UserOut)
async def put_user(pk: int, items: request.PutUserIn, query_sets=Depends(data_range_permission(User))):
    """修改用户信息"""
    instance = await get_instance(query_sets, pk)
    items = items.model_dump()

    @atomic()
    async def _patch():
        role_ids = items.pop("role_ids")
        dept_ids = items.pop("dept_ids")
        items.pop("password", None)  # 修改用户时不允许修改密码, 密码单独接口修改
        roles = await Role.filter(id__in=role_ids)
        depts = await Dept.filter(id__in=dept_ids)

        await User.filter(id=instance.id).update(**items)

        await instance.roles.clear()
        await instance.depts.clear()
        await instance.roles.add(*roles)
        await instance.depts.add(*depts)

    await _patch()
    await instance.fetch_related("roles", "depts")
    return instance


@router.put("/{pk}/password", summary="修改密码")
async def change_user_password(
    pk: int, items: request.ChangePasswordIn, query_sets=Depends(data_range_permission(User))
):
    """修改密码"""
    instance = await get_instance(query_sets, pk)
    await instance.change_password(items.password)
    return


@router.delete("/{pk}", summary="删除用户")
async def delete_user(pk: int, query_sets=Depends(data_range_permission(User))):
    """删除用户"""
    instance = await get_instance(query_sets, pk)

    @atomic()
    async def _delete():
        await instance.roles.clear()
        await instance.depts.clear()
        await instance.delete()

    await _delete()
    return
