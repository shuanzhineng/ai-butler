from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE `menu` ADD `code` VARCHAR(255) NOT NULL UNIQUE COMMENT '菜单代码';
        ALTER TABLE `train_task` ADD `network` VARCHAR(255) NOT NULL  COMMENT '模型网络' DEFAULT '';
        ALTER TABLE `menu` ADD UNIQUE INDEX `uid_menu_code_e2bb96` (`code`);"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE `menu` DROP INDEX `idx_menu_code_e2bb96`;
        ALTER TABLE `menu` DROP COLUMN `code`;
        ALTER TABLE `train_task` DROP COLUMN `network`;"""
