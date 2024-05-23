from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS `celery_worker` (
    `id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '主键id',
    `create_time` DATETIME(6) NOT NULL  COMMENT '创建时间' DEFAULT CURRENT_TIMESTAMP(6),
    `update_time` DATETIME(6) NOT NULL  COMMENT '更新时间' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `name` VARCHAR(255) NOT NULL UNIQUE COMMENT 'worker名称',
    `is_online` BOOL NOT NULL  COMMENT '是否在线' DEFAULT 1,
    `listen_queue` VARCHAR(255) NOT NULL  COMMENT '监听的队列',
    `concurrency` INT NOT NULL  COMMENT '最高并发数',
    `creator_id` BIGINT,
    `dept_belong_id` BIGINT,
    `modifier_id` BIGINT
) CHARACTER SET utf8mb4 COMMENT='celery worker';"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        DROP TABLE IF EXISTS `celery_worker`;"""
