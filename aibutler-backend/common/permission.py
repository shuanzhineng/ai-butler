#
# async def permission_filter(model: Type[MODEL], user: User) -> QuerySet[MODEL]:
#     """数据存在校验"""
#     if user.is_superuser:
#         return model.all()
#     roles = await user.roles.all()
#     # 获取最高权限的角色
#     # 根据角色进行过滤
#     pass
#
