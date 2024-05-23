from tortoise import signals
import importlib.util
import inspect
from common.db import DBBaseModel
import importlib
from conf.settings import settings


async def add_dept_belong_id(_, obj, *args, **kwargs):
    """自动添加数据归属部门"""
    if not obj.creator:
        return
    creator = await obj.creator
    if not obj.id and creator:
        obj.dept_belong = await creator.depts.all().first()


def registration_db_signal():
    """注册db信号"""
    classes = []
    for module_name in settings.TORTOISE_ORM_MODELS:
        module = importlib.import_module(module_name)
        # 获取模块中的所有类
        for name, m in inspect.getmembers(module, inspect.isclass):
            if issubclass(m, DBBaseModel):
                classes.append(m)

    signals.pre_save(*classes)(add_dept_belong_id)
