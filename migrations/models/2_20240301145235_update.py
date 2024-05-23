from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS `label_task` (
    `id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '主键id',
    `create_time` DATETIME(6) NOT NULL  COMMENT '创建时间' DEFAULT CURRENT_TIMESTAMP(6),
    `update_time` DATETIME(6) NOT NULL  COMMENT '更新时间' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `name` VARCHAR(255) NOT NULL  COMMENT '任务名称',
    `description` VARCHAR(255) NOT NULL  COMMENT '标注任务描述' DEFAULT '',
    `tips` LONGTEXT NOT NULL  COMMENT '标注任务提示',
    `config` LONGTEXT NOT NULL  COMMENT '任务配置yaml',
    `media_type` VARCHAR(255) NOT NULL  COMMENT '数据类型' DEFAULT 'IMAGE',
    `status` VARCHAR(255) NOT NULL  COMMENT '任务状态' DEFAULT 'DRAFT',
    `last_sample_inner_id` INT NOT NULL  COMMENT '任务中样本的最后一个内部id' DEFAULT 0,
    `creator_id` BIGINT,
    `dept_belong_id` BIGINT,
    `modifier_id` BIGINT
) CHARACTER SET utf8mb4 COMMENT='标注任务';
        CREATE TABLE IF NOT EXISTS `label_task_attachment` (
    `id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '主键id',
    `create_time` DATETIME(6) NOT NULL  COMMENT '创建时间' DEFAULT CURRENT_TIMESTAMP(6),
    `update_time` DATETIME(6) NOT NULL  COMMENT '更新时间' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `file_path` VARCHAR(255) NOT NULL  COMMENT '文件path' DEFAULT '',
    `local_file_path` VARCHAR(255) NOT NULL  COMMENT '本地文件path' DEFAULT '',
    `creator_id` BIGINT,
    `dept_belong_id` BIGINT,
    `label_task_id` BIGINT,
    `modifier_id` BIGINT
) CHARACTER SET utf8mb4 COMMENT='标注任务附件';
        CREATE TABLE IF NOT EXISTS `label_task_sample` (
    `id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '主键id',
    `create_time` DATETIME(6) NOT NULL  COMMENT '创建时间' DEFAULT CURRENT_TIMESTAMP(6),
    `update_time` DATETIME(6) NOT NULL  COMMENT '更新时间' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `task_attachment_ids` VARCHAR(255) NOT NULL  COMMENT '任务附件id',
    `annotated_count` INT NOT NULL  COMMENT '样本标注数' DEFAULT 0,
    `data` JSON NOT NULL  COMMENT '标注结果',
    `state` VARCHAR(255) NOT NULL  COMMENT '标注状态' DEFAULT 'NEW',
    `creator_id` BIGINT,
    `dept_belong_id` BIGINT,
    `label_task_id` BIGINT,
    `modifier_id` BIGINT
) CHARACTER SET utf8mb4 COMMENT='标注任务样本';"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        DROP TABLE IF EXISTS `label_task`;
        DROP TABLE IF EXISTS `label_task_attachment`;
        DROP TABLE IF EXISTS `label_task_sample`;"""
