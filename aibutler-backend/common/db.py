"""
DB 基类
"""
from tortoise import fields
from tortoise.models import Model
from tortoise.fields.base import OnDelete


class DBBaseModel(Model):
    id = fields.BigIntField(pk=True, description="主键id")
    create_time = fields.DatetimeField(auto_now_add=True, description="创建时间")
    update_time = fields.DatetimeField(auto_now=True, description="更新时间")
    # is_removed = fields.BooleanField(description="是否删除", default=False)
    creator = fields.ForeignKeyField(
        "models.User",
        on_delete=OnDelete.NO_ACTION,
        description="创建人",
        null=True,
        db_constraint=False,
        related_name=False,
    )
    modifier = fields.ForeignKeyField(
        "models.User",
        on_delete=OnDelete.NO_ACTION,
        description="修改人",
        null=True,
        db_constraint=False,
        related_name=False,
    )
    dept_belong = fields.ForeignKeyField(
        "models.Dept",
        on_delete=OnDelete.NO_ACTION,
        description="数据归属部门",
        null=True,
        db_constraint=False,
        related_name=False,
    )

    class Meta:
        abstract = True
