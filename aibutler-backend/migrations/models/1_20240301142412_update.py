from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE `access_log` MODIFY COLUMN `dept_belong_id` BIGINT   COMMENT '数据归属部门';
        ALTER TABLE `access_log` MODIFY COLUMN `modifier_id` BIGINT   COMMENT '修改人';
        ALTER TABLE `dept` MODIFY COLUMN `dept_belong_id` BIGINT   COMMENT '数据归属部门';
        ALTER TABLE `dept` MODIFY COLUMN `modifier_id` BIGINT   COMMENT '修改人';
        ALTER TABLE `login_log` MODIFY COLUMN `dept_belong_id` BIGINT   COMMENT '数据归属部门';
        ALTER TABLE `login_log` MODIFY COLUMN `modifier_id` BIGINT   COMMENT '修改人';
        ALTER TABLE `menu` MODIFY COLUMN `dept_belong_id` BIGINT   COMMENT '数据归属部门';
        ALTER TABLE `menu` MODIFY COLUMN `modifier_id` BIGINT   COMMENT '修改人';
        ALTER TABLE `menu_api_permission` MODIFY COLUMN `dept_belong_id` BIGINT   COMMENT '数据归属部门';
        ALTER TABLE `menu_api_permission` MODIFY COLUMN `modifier_id` BIGINT   COMMENT '修改人';
        ALTER TABLE `role` MODIFY COLUMN `dept_belong_id` BIGINT   COMMENT '数据归属部门';
        ALTER TABLE `role` MODIFY COLUMN `modifier_id` BIGINT   COMMENT '修改人';
        ALTER TABLE `user` MODIFY COLUMN `dept_belong_id` BIGINT   COMMENT '数据归属部门';
        ALTER TABLE `user` MODIFY COLUMN `modifier_id` BIGINT   COMMENT '修改人';"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE `dept` MODIFY COLUMN `dept_belong_id` BIGINT   COMMENT '数据归属部门id';
        ALTER TABLE `dept` MODIFY COLUMN `modifier_id` BIGINT   COMMENT '修改人id';
        ALTER TABLE `menu` MODIFY COLUMN `dept_belong_id` BIGINT   COMMENT '数据归属部门id';
        ALTER TABLE `menu` MODIFY COLUMN `modifier_id` BIGINT   COMMENT '修改人id';
        ALTER TABLE `role` MODIFY COLUMN `dept_belong_id` BIGINT   COMMENT '数据归属部门id';
        ALTER TABLE `role` MODIFY COLUMN `modifier_id` BIGINT   COMMENT '修改人id';
        ALTER TABLE `user` MODIFY COLUMN `dept_belong_id` BIGINT   COMMENT '数据归属部门id';
        ALTER TABLE `user` MODIFY COLUMN `modifier_id` BIGINT   COMMENT '修改人id';
        ALTER TABLE `login_log` MODIFY COLUMN `dept_belong_id` BIGINT   COMMENT '数据归属部门id';
        ALTER TABLE `login_log` MODIFY COLUMN `modifier_id` BIGINT   COMMENT '修改人id';
        ALTER TABLE `access_log` MODIFY COLUMN `dept_belong_id` BIGINT   COMMENT '数据归属部门id';
        ALTER TABLE `access_log` MODIFY COLUMN `modifier_id` BIGINT   COMMENT '修改人id';
        ALTER TABLE `menu_api_permission` MODIFY COLUMN `dept_belong_id` BIGINT   COMMENT '数据归属部门id';
        ALTER TABLE `menu_api_permission` MODIFY COLUMN `modifier_id` BIGINT   COMMENT '修改人id';"""
