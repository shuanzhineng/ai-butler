from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE `dept` RENAME COLUMN `key` TO `code`;
        ALTER TABLE `role` RENAME COLUMN `key` TO `code`;"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE `dept` RENAME COLUMN `code` TO `key`;
        ALTER TABLE `role` RENAME COLUMN `code` TO `key`;"""
