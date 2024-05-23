from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS `aerich` (
    `id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `version` VARCHAR(255) NOT NULL,
    `app` VARCHAR(100) NOT NULL,
    `content` JSON NOT NULL
) CHARACTER SET utf8mb4;
CREATE TABLE IF NOT EXISTS `user` (
    `id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '主键id',
    `create_time` DATETIME(6) NOT NULL  COMMENT '创建时间' DEFAULT CURRENT_TIMESTAMP(6),
    `update_time` DATETIME(6) NOT NULL  COMMENT '更新时间' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `modifier_id` BIGINT   COMMENT '修改人id',
    `dept_belong_id` BIGINT   COMMENT '数据归属部门id',
    `name` VARCHAR(255) NOT NULL  COMMENT '用户姓名' DEFAULT '',
    `username` VARCHAR(255) NOT NULL UNIQUE COMMENT '用户名',
    `password` VARCHAR(255) NOT NULL  COMMENT '密码hash值',
    `phone` VARCHAR(255) NOT NULL  COMMENT '手机号' DEFAULT '',
    `email` VARCHAR(255) NOT NULL  COMMENT '邮箱' DEFAULT '',
    `disabled` BOOL NOT NULL  COMMENT '是否禁用' DEFAULT 0,
    `description` VARCHAR(255) NOT NULL  COMMENT '用户描述' DEFAULT '',
    `creator_id` BIGINT
) CHARACTER SET utf8mb4 COMMENT='用户表';
CREATE TABLE IF NOT EXISTS `access_log` (
    `id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '主键id',
    `create_time` DATETIME(6) NOT NULL  COMMENT '创建时间' DEFAULT CURRENT_TIMESTAMP(6),
    `update_time` DATETIME(6) NOT NULL  COMMENT '更新时间' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `modifier_id` BIGINT   COMMENT '修改人id',
    `dept_belong_id` BIGINT   COMMENT '数据归属部门id',
    `api` VARCHAR(255) NOT NULL  COMMENT '接口地址' DEFAULT '',
    `method` VARCHAR(255) NOT NULL  COMMENT '接口请求方法',
    `ip_address` VARCHAR(255) NOT NULL  COMMENT 'ip地址' DEFAULT '',
    `browser` VARCHAR(255) NOT NULL  COMMENT '浏览器信息' DEFAULT '',
    `os` VARCHAR(255) NOT NULL  COMMENT '操作系统信息' DEFAULT '',
    `http_status_code` INT NOT NULL  COMMENT 'http状态码' DEFAULT 0,
    `request_body` LONGTEXT NOT NULL  COMMENT '请求体',
    `response_body` LONGTEXT NOT NULL  COMMENT '响应体',
    `creator_id` BIGINT
) CHARACTER SET utf8mb4 COMMENT='访问日志';
CREATE TABLE IF NOT EXISTS `dept` (
    `id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '主键id',
    `create_time` DATETIME(6) NOT NULL  COMMENT '创建时间' DEFAULT CURRENT_TIMESTAMP(6),
    `update_time` DATETIME(6) NOT NULL  COMMENT '更新时间' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `modifier_id` BIGINT   COMMENT '修改人id',
    `dept_belong_id` BIGINT   COMMENT '数据归属部门id',
    `name` VARCHAR(255) NOT NULL  COMMENT '部门名称',
    `key` VARCHAR(255) NOT NULL  COMMENT '关联字符' DEFAULT '',
    `owner` VARCHAR(255) NOT NULL  COMMENT '负责人',
    `phone` VARCHAR(255) NOT NULL  COMMENT '手机号',
    `email` VARCHAR(255) NOT NULL  COMMENT '邮箱',
    `disabled` BOOL NOT NULL  COMMENT '是否禁用' DEFAULT 0,
    `sort` INT NOT NULL  COMMENT '排序号' DEFAULT 1,
    `description` VARCHAR(255) NOT NULL  COMMENT '角色描述',
    `creator_id` BIGINT,
    `parent_id` BIGINT
) CHARACTER SET utf8mb4 COMMENT='部门';
CREATE TABLE IF NOT EXISTS `login_log` (
    `id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '主键id',
    `create_time` DATETIME(6) NOT NULL  COMMENT '创建时间' DEFAULT CURRENT_TIMESTAMP(6),
    `update_time` DATETIME(6) NOT NULL  COMMENT '更新时间' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `modifier_id` BIGINT   COMMENT '修改人id',
    `dept_belong_id` BIGINT   COMMENT '数据归属部门id',
    `username` VARCHAR(255) NOT NULL  COMMENT '用户名',
    `ip_address` VARCHAR(255) NOT NULL  COMMENT 'ip地址' DEFAULT '',
    `browser` VARCHAR(255) NOT NULL  COMMENT '浏览器信息' DEFAULT '',
    `os` VARCHAR(255) NOT NULL  COMMENT '操作系统信息' DEFAULT '',
    `http_status_code` INT NOT NULL  COMMENT 'http状态码' DEFAULT 0,
    `is_success` BOOL NOT NULL  COMMENT '是否成功' DEFAULT 0,
    `creator_id` BIGINT
) CHARACTER SET utf8mb4 COMMENT='访问日志';
CREATE TABLE IF NOT EXISTS `menu` (
    `id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '主键id',
    `create_time` DATETIME(6) NOT NULL  COMMENT '创建时间' DEFAULT CURRENT_TIMESTAMP(6),
    `update_time` DATETIME(6) NOT NULL  COMMENT '更新时间' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `modifier_id` BIGINT   COMMENT '修改人id',
    `dept_belong_id` BIGINT   COMMENT '数据归属部门id',
    `name` VARCHAR(255) NOT NULL  COMMENT '菜单名称',
    `icon` VARCHAR(255) NOT NULL  COMMENT '图标代码' DEFAULT '',
    `sort` INT NOT NULL  COMMENT '排序号' DEFAULT 1,
    `is_link` BOOL NOT NULL  COMMENT '是否外链' DEFAULT 0,
    `link_url` VARCHAR(255) NOT NULL  COMMENT '链接地址' DEFAULT '',
    `genre` VARCHAR(255) NOT NULL  COMMENT '菜单类型',
    `web_path` VARCHAR(255) NOT NULL  COMMENT '路由地址' DEFAULT '',
    `disabled` BOOL NOT NULL  COMMENT '是否禁用' DEFAULT 0,
    `creator_id` BIGINT,
    `parent_id` BIGINT
) CHARACTER SET utf8mb4 COMMENT='菜单';
CREATE TABLE IF NOT EXISTS `menu_api_permission` (
    `id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '主键id',
    `create_time` DATETIME(6) NOT NULL  COMMENT '创建时间' DEFAULT CURRENT_TIMESTAMP(6),
    `update_time` DATETIME(6) NOT NULL  COMMENT '更新时间' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `modifier_id` BIGINT   COMMENT '修改人id',
    `dept_belong_id` BIGINT   COMMENT '数据归属部门id',
    `api` VARCHAR(255) NOT NULL  COMMENT '接口地址' DEFAULT '',
    `method` VARCHAR(255) NOT NULL  COMMENT '接口请求方法',
    `creator_id` BIGINT,
    `menu_id` BIGINT
) CHARACTER SET utf8mb4 COMMENT='菜单接口权限';
CREATE TABLE IF NOT EXISTS `role` (
    `id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '主键id',
    `create_time` DATETIME(6) NOT NULL  COMMENT '创建时间' DEFAULT CURRENT_TIMESTAMP(6),
    `update_time` DATETIME(6) NOT NULL  COMMENT '更新时间' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `modifier_id` BIGINT   COMMENT '修改人id',
    `dept_belong_id` BIGINT   COMMENT '数据归属部门id',
    `name` VARCHAR(255) NOT NULL  COMMENT '角色名称',
    `key` VARCHAR(255) NOT NULL  COMMENT '权限字符' DEFAULT '',
    `disabled` BOOL NOT NULL  COMMENT '是否禁用' DEFAULT 0,
    `sort` INT NOT NULL  COMMENT '排序号' DEFAULT 1,
    `description` VARCHAR(255) NOT NULL  COMMENT '角色描述',
    `data_range` SMALLINT NOT NULL  COMMENT '数据范围' DEFAULT 0,
    `creator_id` BIGINT
) CHARACTER SET utf8mb4 COMMENT='角色';
CREATE TABLE IF NOT EXISTS `user_dept` (
    `user_id` BIGINT NOT NULL,
    `dept_id` BIGINT NOT NULL
) CHARACTER SET utf8mb4 COMMENT='部门';
CREATE TABLE IF NOT EXISTS `user_role` (
    `user_id` BIGINT NOT NULL,
    `role_id` BIGINT NOT NULL
) CHARACTER SET utf8mb4 COMMENT='角色';
CREATE TABLE IF NOT EXISTS `role_dept` (
    `role_id` BIGINT NOT NULL,
    `dept_id` BIGINT NOT NULL
) CHARACTER SET utf8mb4 COMMENT='自定义数据权限勾选的部门';
CREATE TABLE IF NOT EXISTS `role_menu` (
    `role_id` BIGINT NOT NULL,
    `menu_id` BIGINT NOT NULL
) CHARACTER SET utf8mb4 COMMENT='具备权限的菜单';"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        """
