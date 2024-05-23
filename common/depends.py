from common.authentication import need_access_token, selectable_access_token
from typing import Annotated
from fastapi import Depends
from apps.system.models.db import User, Dept, Role, Menu
from common.db import DBBaseModel
from tortoise.queryset import QuerySet
from typing import Type, Callable
from fastapi import Request
from conf.settings import settings
from common.exceptions import CommonError
from common.enums import DataScopeEnum

# 可选登录
SelectableAuthorization = Annotated[User | None, Depends(selectable_access_token)]
# 必须登录
NeedAuthorization = Annotated[User, Depends(need_access_token)]


def data_range_permission(model_class: Type[DBBaseModel]) -> Callable:
    """数据范围权限"""

    async def inner(user: User = Depends(need_access_token)) -> QuerySet:
        # 获取最大权限的角色
        role = await user.roles.all().order_by("-data_range").first()
        query_sets = model_class.all()
        if user.is_superuser:
            pass
        elif not role:  # 未绑定角色
            query_sets = query_sets.filter(creator=user)
        elif role.data_range == DataScopeEnum.ONLY_SELF:
            query_sets = query_sets.filter(creator=user)
        elif role.data_range == DataScopeEnum.ONLY_DEPARTMENT:
            if dept_belong_obj := await user.depts.all().first():
                query_sets = query_sets.filter(dept_belong__id=dept_belong_obj.id)
            else:
                query_sets = query_sets.filter(creator=user)
        elif role.data_range == DataScopeEnum.SELF_AND_SUBORDINATES:
            # 查询当前机构的所有子级机构
            if dept_belong_obj := await user.depts.all().first():
                depts = await Dept.get_children(parent_ids=[dept_belong_obj.id])
                depts = [dept_belong_obj.id] + depts
                query_sets = query_sets.filter(dept_belong__id__in=depts)
            else:
                query_sets = query_sets.filter(creator=user)
        elif role.data_range == DataScopeEnum.CUSTOM:
            depts = await role.depts.all().values_list("id", flat=True)
            query_sets = query_sets.filter(dept_belong__id__in=depts)
        elif role.data_range == DataScopeEnum.ALL:
            pass
        if model_class == Dept:
            # 将当前用户的归属部门加入列表
            dept_ids = await query_sets.all().values_list("id", flat=True)
            user_dept_ids = await user.depts.all().values_list("id", flat=True)
            query_sets = model_class.filter(id__in=list(set(dept_ids + user_dept_ids)))
        elif model_class == Role:
            # 将当前用户的角色加入列表
            role_ids = await query_sets.all().values_list("id", flat=True)
            user_role_ids = await user.roles.all().values_list("id", flat=True)
            query_sets = model_class.filter(id__in=list(set(role_ids + user_role_ids)))
        elif model_class == User:
            user_ids = await query_sets.all().values_list("id", flat=True)
            user_ids += [user.id]
            query_sets = model_class.filter(id__in=user_ids)
        elif model_class == Menu:
            menu_ids = await query_sets.all().values_list("id", flat=True)
            roles = await user.roles.all()
            for role in roles:
                menu_ids.extend(list(await role.menus.all().values_list("id", flat=True)))
            menu_ids = list(set(menu_ids))
            query_sets = model_class.filter(id__in=menu_ids)
        return query_sets

    return inner


async def inner_authentication(request: Request):
    authorization = request.headers.get("Authorization")
    if authorization != f"Bearer {settings.INNER_AUTHENTICATION_TOKEN}":
        raise CommonError.InnerAuthenticationError
    return
