from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE `train_task_group` ADD `ai_model_type` VARCHAR(255) NOT NULL  COMMENT '模型类型' DEFAULT 'OBJECT_DETECTION';
        ALTER TABLE `train_task_group` DROP COLUMN `model_type`;"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE `train_task_group` ADD `model_type` VARCHAR(255) NOT NULL  COMMENT '数据类型' DEFAULT 'OBJECT_DETECTION';
        ALTER TABLE `train_task_group` DROP COLUMN `ai_model_type`;"""
