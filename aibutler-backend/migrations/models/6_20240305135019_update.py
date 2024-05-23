from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS `train_task` (
    `id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '主键id',
    `create_time` DATETIME(6) NOT NULL  COMMENT '创建时间' DEFAULT CURRENT_TIMESTAMP(6),
    `update_time` DATETIME(6) NOT NULL  COMMENT '更新时间' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `start_datetime` DATETIME(6)   COMMENT '训练开始时间',
    `end_datetime` DATETIME(6)   COMMENT '训练结束时间',
    `version` INT NOT NULL  COMMENT '版本' DEFAULT 1,
    `description` VARCHAR(255) NOT NULL  COMMENT '训练任务描述' DEFAULT '',
    `status` VARCHAR(255) NOT NULL  COMMENT '训练状态' DEFAULT 'WAITING',
    `params` JSON   COMMENT '训练参数',
    `base_task_id` BIGINT,
    `creator_id` BIGINT,
    `dept_belong_id` BIGINT,
    `log_file_id` BIGINT,
    `modifier_id` BIGINT,
    `result_file_id` BIGINT,
    `train_task_group_id` BIGINT
) CHARACTER SET utf8mb4 COMMENT='训练任务';
        CREATE TABLE IF NOT EXISTS `train_task_group` (
    `id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '主键id',
    `create_time` DATETIME(6) NOT NULL  COMMENT '创建时间' DEFAULT CURRENT_TIMESTAMP(6),
    `update_time` DATETIME(6) NOT NULL  COMMENT '更新时间' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `name` VARCHAR(255) NOT NULL  COMMENT '训练任务组名称' DEFAULT '',
    `model_type` VARCHAR(255) NOT NULL  COMMENT '数据类型' DEFAULT 'OBJECT_DETECTION',
    `description` VARCHAR(255) NOT NULL  COMMENT '训练任务组描述' DEFAULT '',
    `disabled` BOOL NOT NULL  COMMENT '是否禁用' DEFAULT 0,
    `creator_id` BIGINT,
    `dept_belong_id` BIGINT,
    `modifier_id` BIGINT
) CHARACTER SET utf8mb4 COMMENT='训练任务组';
        CREATE TABLE `train_task_data_set` (
    `dataset_id` BIGINT NOT NULL REFERENCES `data_set` (`id`) ON DELETE CASCADE,
    `train_task_id` BIGINT NOT NULL REFERENCES `train_task` (`id`) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COMMENT='数据集';"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        DROP TABLE IF EXISTS `train_task_data_set`;
        DROP TABLE IF EXISTS `train_task`;
        DROP TABLE IF EXISTS `train_task_group`;"""
