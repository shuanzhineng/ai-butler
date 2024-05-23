from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE `celery_worker` ADD `ip_address` VARCHAR(255) NOT NULL  COMMENT '最高并发数' DEFAULT '';
        ALTER TABLE `celery_worker` ADD `available_ports` JSON NOT NULL  COMMENT '可用端口号';
        ALTER TABLE `train_task` ADD `celery_task_id` VARCHAR(255) NOT NULL  COMMENT 'celery任务id' DEFAULT '';
        ALTER TABLE `train_task` ADD `framework` VARCHAR(255) NOT NULL  COMMENT '训练框架' DEFAULT 'PyTorch';"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE `train_task` DROP COLUMN `celery_task_id`;
        ALTER TABLE `train_task` DROP COLUMN `framework`;
        ALTER TABLE `celery_worker` DROP COLUMN `ip_address`;
        ALTER TABLE `celery_worker` DROP COLUMN `available_ports`;"""
