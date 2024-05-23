from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS `data_set` (
    `id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '主键id',
    `create_time` DATETIME(6) NOT NULL  COMMENT '创建时间' DEFAULT CURRENT_TIMESTAMP(6),
    `update_time` DATETIME(6) NOT NULL  COMMENT '更新时间' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `version` INT NOT NULL  COMMENT '数据集版本' DEFAULT 1,
    `description` VARCHAR(255) NOT NULL  COMMENT '数据集描述',
    `creator_id` BIGINT,
    `data_set_group_id` BIGINT NOT NULL,
    `dept_belong_id` BIGINT,
    `file_id` BIGINT,
    `modifier_id` BIGINT
) CHARACTER SET utf8mb4 COMMENT='数据集';
        CREATE TABLE IF NOT EXISTS `data_set_group` (
    `id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '主键id',
    `create_time` DATETIME(6) NOT NULL  COMMENT '创建时间' DEFAULT CURRENT_TIMESTAMP(6),
    `update_time` DATETIME(6) NOT NULL  COMMENT '更新时间' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `name` VARCHAR(255) NOT NULL  COMMENT '数据集组名称',
    `description` VARCHAR(255) NOT NULL  COMMENT '数据集组描述',
    `disabled` BOOL NOT NULL  COMMENT '是否禁用' DEFAULT 0,
    `data_type` VARCHAR(255) NOT NULL  COMMENT '数据类型' DEFAULT 'IMAGE',
    `annotation_type` VARCHAR(255) NOT NULL  COMMENT '数据类型' DEFAULT 'OBJECT_DETECTION',
    `creator_id` BIGINT,
    `dept_belong_id` BIGINT,
    `modifier_id` BIGINT
) CHARACTER SET utf8mb4 COMMENT='数据集组';
        CREATE TABLE IF NOT EXISTS `oss_file` (
    `id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '主键id',
    `create_time` DATETIME(6) NOT NULL  COMMENT '创建时间' DEFAULT CURRENT_TIMESTAMP(6),
    `update_time` DATETIME(6) NOT NULL  COMMENT '更新时间' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `bucket` VARCHAR(255) NOT NULL  COMMENT '数据桶' DEFAULT '',
    `server_address` VARCHAR(255) NOT NULL  COMMENT '存储服务地址' DEFAULT ':',
    `path` VARCHAR(255) NOT NULL  COMMENT '存储路径',
    `filename` VARCHAR(255) NOT NULL  COMMENT '文件名' DEFAULT '',
    `file_size` INT   COMMENT '文件大小',
    `creator_id` BIGINT,
    `dept_belong_id` BIGINT,
    `modifier_id` BIGINT
) CHARACTER SET utf8mb4 COMMENT='云存储文件';"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        DROP TABLE IF EXISTS `data_set`;
        DROP TABLE IF EXISTS `data_set_group`;
        DROP TABLE IF EXISTS `oss_file`;"""
