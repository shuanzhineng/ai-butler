from fastapi import APIRouter, Depends
from apps.system.models.db import Dept
from apps.system.models import request, response
from common.depends import NeedAuthorization, data_range_permission
from common.utils import get_instance, construct_tree
from fastapi_pagination import Page, Params
from http import HTTPStatus
from fastapi_pagination.ext.tortoise import paginate
from common.custom_route import CustomRoute
from tortoise.expressions import Q

router = APIRouter(
    prefix="/depts", tags=["部门管理"], responses={404: {"description": "Not found"}}, route_class=CustomRoute
)


@router.get("", summary="部门列表", response_model=Page[response.QueryDeptOut])
async def depts(query_sets=Depends(data_range_permission(Dept)), parent_id: str | None = None, params=Depends(Params)):
    """部门列表"""
    if not parent_id:
        parent_id = None
    query_sets = query_sets.filter(parent=parent_id)
    output = await paginate(query_sets, params=params)
    # 在分页结果中修改child
    for obj in output.items:
        hava_child = bool(await query_sets.filter(parent=obj.id))
        obj.child = hava_child
    return output


@router.get("/unfold", summary="平铺部门列表", response_model=Page[response.DeptNoParentOut])
async def unfold_depts(
    query_sets=Depends(data_range_permission(Dept)),
    keyword: str = "",
    name: str = "",
    disabled: bool | None = None,
    params=Depends(Params),
):
    """部门列表"""
    if keyword:
        query_sets = query_sets.filter(
            Q(name__icontains=keyword)
            | Q(code__icontains=keyword)
            | Q(owner__icontains=keyword)
            | Q(phone__icontains=keyword)
            | Q(email__icontains=keyword)
            | Q(description__icontains=keyword)
        )
    if name:
        query_sets = query_sets.filter(name=name)
    if disabled is not None:
        query_sets = query_sets.filter(disabled=disabled)
    output = await paginate(query_sets, params=params)
    # 在分页结果中修改child
    return output


@router.get("/full-tree", summary="部门树", response_model=list[response.QueryDeptTreeOut])
async def dept_tree(query_sets=Depends(data_range_permission(Dept))):
    """完整菜单树"""
    query_sets = await query_sets.prefetch_related("parent")
    tree = construct_tree(query_sets)
    output = []
    for obj in tree:
        result = dict(await response.QueryDeptTreeOut.from_tortoise_orm(obj))
        output.append(result)
    return output


@router.get("/{pk}", summary="部门详情", response_model=response.DeptDetailOut)
async def retrieve_dept(pk: int, query_sets=Depends(data_range_permission(Dept))):
    """部门详情"""
    instance = await get_instance(query_sets, pk)
    return instance


@router.post("", summary="创建部门", response_model=response.DeptDetailOut, status_code=HTTPStatus.CREATED)
async def create_dept(user: NeedAuthorization, items: request.CreateDeptIn):
    """创建部门"""
    instance = await Dept.create(**items.model_dump(), creator=user)
    return instance


@router.put("/{pk}", summary="修改部门", response_model=response.DeptDetailOut)
async def put_dept(
    pk: int, user: NeedAuthorization, items: request.CreateDeptIn, query_sets=Depends(data_range_permission(Dept))
):
    """修改部门"""
    instance = await get_instance(query_sets, pk)
    modifier = user
    await query_sets.filter(id=instance.id).update(**items.model_dump(), modifier=modifier)
    instance = await query_sets.get(id=pk)
    return instance


@router.delete("/{pk}", summary="删除部门")
async def delete_dept(pk: int, query_sets=Depends(data_range_permission(Dept))):
    """删除部门"""
    instance = await get_instance(query_sets, pk)
    await query_sets.filter(parent=instance).update(parent_id=None)
    await instance.delete()
    return
