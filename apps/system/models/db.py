from common.enums import APIMethodEnum, DataScopeEnum, MenuGenreEnum
from typing import Any

from tortoise import fields
from tortoise.fields.base import OnDelete

from common.db import DBBaseModel
from common.utils import get_password_hash, verify_password


class User(DBBaseModel):
    """用户表"""

    id = fields.BigIntField(pk=True, description="主键id")
    is_superuser = fields.BooleanField(default=False, description="是否为超级用户")
    name = fields.CharField(max_length=255, description="用户姓名", default="")
    username = fields.CharField(max_length=255, description="用户名", unique=True)
    password = fields.CharField(max_length=255, description="密码hash值")
    phone = fields.CharField(max_length=255, description="手机号", default="")
    email = fields.CharField(max_length=255, description="邮箱", default="")
    disabled = fields.BooleanField(description="是否禁用", default=False)
    description = fields.CharField(max_length=255, description="用户描述", default="")
    roles = fields.ManyToManyField(
        "models.Role", on_delete=OnDelete.NO_ACTION, description="角色", db_constraint=False, related_name="users"
    )
    depts = fields.ManyToManyField(  # 使用多对多存储部门, 避免与创建人字段循环外键
        "models.Dept",
        on_delete=OnDelete.NO_ACTION,
        description="部门",
        related_name="users",
        db_constraint=False,
    )

    class Meta:
        table = "user"
        table_description = "用户表"
        ordering = ("-id",)

    @classmethod
    async def create_user(cls: type["User"], username: str, password: str, **kwargs: Any) -> "User":
        """存储hash密码"""
        hash_password = get_password_hash(password)
        user = await cls.create(username=username, password=hash_password, **kwargs)
        return user

    async def verify_password(self, password: str) -> bool:
        """验证密码是否正确"""
        return verify_password(password, self.password)

    async def change_password(self, password: str) -> None:
        """修改密码"""
        hash_password = get_password_hash(password)
        self.password = hash_password
        await self.save()


class Dept(DBBaseModel):
    """部门"""

    name = fields.CharField(max_length=255, description="部门名称")
    code = fields.CharField(max_length=255, description="关联字符", default="")
    owner = fields.CharField(max_length=255, description="负责人")
    phone = fields.CharField(max_length=255, description="手机号")
    email = fields.CharField(max_length=255, description="邮箱")
    disabled = fields.BooleanField(description="是否禁用", default=False)
    sort = fields.IntField(description="排序号", default=1)
    description = fields.CharField(max_length=255, description="角色描述")
    parent = fields.ForeignKeyField(
        "models.Dept", on_delete=OnDelete.NO_ACTION, description="上级部门", null=True, db_constraint=False
    )

    class Meta:
        table = "dept"
        table_description = "部门"
        ordering = ("sort", "-id")

    @classmethod
    async def get_children(cls, parent_ids):
        # 获取所有直接子节点, 返回结果不含当前节点
        children = await cls.filter(parent__id__in=parent_ids).values_list("id", flat=True)
        if not children:
            return []

        # 递归获取更深层次的子节点
        recursive_children = await cls.get_children(parent_ids=children)

        # 将直接子节点和递归子节点合并
        return list(children) + recursive_children


class Menu(DBBaseModel):
    """菜单"""

    name = fields.CharField(max_length=255, description="菜单名称")
    code = fields.CharField(max_length=255, description="菜单代码", unique=True)
    icon = fields.CharField(max_length=255, description="图标代码", default="")
    sort = fields.IntField(description="排序号", default=1)
    is_link = fields.BooleanField(default=False, description="是否外链")
    link_url = fields.CharField(max_length=255, description="链接地址", default="")
    genre = fields.CharEnumField(enum_type=MenuGenreEnum, max_length=255, description="菜单类型")
    web_path = fields.CharField(max_length=255, description="路由地址", default="")
    disabled = fields.BooleanField(description="是否禁用", default=False)
    parent = fields.ForeignKeyField(
        "models.Menu", on_delete=OnDelete.NO_ACTION, description="上级菜单", null=True, db_constraint=False
    )
    api_perms: fields.ForeignKeyRelation["MenuAPIPermission"]

    class Meta:
        table = "menu"
        table_description = "菜单"
        ordering = ("sort", "-id")


class Role(DBBaseModel):
    """角色"""

    name = fields.CharField(max_length=255, description="角色名称")
    code = fields.CharField(max_length=255, description="权限字符", default="")
    disabled = fields.BooleanField(description="是否禁用", default=False)
    sort = fields.IntField(description="排序号", default=1)
    description = fields.CharField(max_length=255, description="角色描述")
    data_range = fields.IntEnumField(enum_type=DataScopeEnum, description="数据范围", default=DataScopeEnum.ONLY_SELF)
    depts = fields.ManyToManyField(
        "models.Dept",
        on_delete=OnDelete.NO_ACTION,
        description="自定义数据权限勾选的部门",
        db_constraint=False,
        related_name="dept_roles",
    )
    menus = fields.ManyToManyField(
        "models.Menu",
        on_delete=OnDelete.NO_ACTION,
        description="具备权限的菜单",
        db_constraint=False,
        related_name="menu_roles",
    )

    class Meta:
        table = "role"
        table_description = "角色"
        ordering = ("sort", "-id")


class MenuAPIPermission(DBBaseModel):
    """菜单按钮"""

    api = fields.CharField(max_length=255, description="接口地址", default="")
    method = fields.CharEnumField(max_length=255, description="接口请求方法", enum_type=APIMethodEnum)
    menu = fields.ForeignKeyField(
        "models.Menu",
        on_delete=OnDelete.NO_ACTION,
        description="菜单",
        related_name="api_perms",
        db_constraint=False,
        null=True,
    )

    class Meta:
        table = "menu_api_permission"
        table_description = "菜单接口权限"
        ordering = ("-id",)


class AccessLog(DBBaseModel):
    """访问日志表"""

    api = fields.CharField(max_length=255, description="接口地址", default="")
    method = fields.CharEnumField(max_length=255, description="接口请求方法", enum_type=APIMethodEnum)
    ip_address = fields.CharField(max_length=255, description="ip地址", default="")
    browser = fields.CharField(max_length=255, description="浏览器信息", default="")
    os = fields.CharField(max_length=255, description="操作系统信息", default="")
    user_agent = fields.CharField(max_length=255, description="请求头中的user_agent", default="")
    http_status_code = fields.IntField(description="http状态码", default=0)
    request_body = fields.TextField(default="", description="请求体")
    response_body = fields.TextField(default="", description="响应体")

    class Meta:
        table = "access_log"
        table_description = "访问日志"
        ordering = ("-id",)


class LoginLog(DBBaseModel):
    """登录日志"""

    username = fields.CharField(max_length=255, description="用户名")
    ip_address = fields.CharField(max_length=255, description="ip地址", default="")
    browser = fields.CharField(max_length=255, description="浏览器信息", default="")
    os = fields.CharField(max_length=255, description="操作系统信息", default="")
    http_status_code = fields.IntField(description="http状态码", default=0)
    is_success = fields.BooleanField(description="是否成功", default=False)
    user_agent = fields.CharField(max_length=255, description="请求头中的user_agent", default="")

    class Meta:
        table = "login_log"
        table_description = "访问日志"
        ordering = ("-id",)


class CeleryWorker(DBBaseModel):
    """训练worker, 用于统计启动中的worker数"""

    name = fields.CharField(max_length=255, description="worker名称", unique=True)
    is_online = fields.BooleanField(description="是否在线", default=True)
    listen_queue = fields.CharField(max_length=255, description="监听的队列")
    concurrency = fields.IntField(description="最高并发数")
    ip_address = fields.CharField(description="最高并发数", default="", max_length=255)
    # 部署worker需要有可用端口才可以进行部署
    available_ports = fields.JSONField(description="可用端口号", default=list)

    class Meta:
        table = "celery_worker"
        table_description = "celery worker"
        ordering = ("-id",)
