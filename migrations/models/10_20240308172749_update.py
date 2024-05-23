from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS `deploy_online_infer` (
    `id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '主键id',
    `create_time` DATETIME(6) NOT NULL  COMMENT '创建时间' DEFAULT CURRENT_TIMESTAMP(6),
    `update_time` DATETIME(6) NOT NULL  COMMENT '更新时间' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `name` VARCHAR(255) NOT NULL  COMMENT '名称' DEFAULT '',
    `description` VARCHAR(255) NOT NULL  COMMENT '描述' DEFAULT '',
    `status` VARCHAR(255) NOT NULL  COMMENT '状态' DEFAULT 'WAITING',
    `reason` LONGTEXT NOT NULL  COMMENT '失败原因',
    `token` VARCHAR(255) NOT NULL  COMMENT '令牌',
    `is_gpu` BOOL NOT NULL  COMMENT '是否gpu部署' DEFAULT 0,
    `infer_address` VARCHAR(255) NOT NULL  COMMENT '推理地址' DEFAULT '',
    `celery_task_id` VARCHAR(255) NOT NULL  COMMENT '异步任务id' DEFAULT '',
    `creator_id` BIGINT,
    `dept_belong_id` BIGINT,
    `modifier_id` BIGINT,
    `train_task_id` BIGINT
) CHARACTER SET utf8mb4 COMMENT='部署在线推理';"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        DROP TABLE IF EXISTS `deploy_online_infer`;"""
