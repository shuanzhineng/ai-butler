from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE `access_log` ADD `user_agent` VARCHAR(255) NOT NULL  COMMENT '请求头中的user_agent' DEFAULT '';
        ALTER TABLE `login_log` ADD `user_agent` VARCHAR(255) NOT NULL  COMMENT '请求头中的user_agent' DEFAULT '';"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE `login_log` DROP COLUMN `user_agent`;
        ALTER TABLE `access_log` DROP COLUMN `user_agent`;"""
