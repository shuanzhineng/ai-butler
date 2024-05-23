from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE `oss_file` ALTER COLUMN `bucket` SET DEFAULT 'aibutler';
        ALTER TABLE `oss_file` ALTER COLUMN `server_address` SET DEFAULT 'test-ai.shuanzhineng.com:9000';"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE `oss_file` ALTER COLUMN `bucket` SET DEFAULT '';
        ALTER TABLE `oss_file` ALTER COLUMN `server_address` SET DEFAULT ':';"""
