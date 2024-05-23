# AI生产管理平台后台

## 技术栈

- [FastAPI](https://fastapi.tiangolo.com/zh/): 快速构建 API 的现代 Python 框架。
- [Tortoise ORM](https://tortoise.github.io/): 是一个易于使用的异步ORM(对象关系映射器)，灵感来自Django。
- [Aerich](https://github.com/tortoise/aerich): 一个用于TortoiseORM的数据库迁移工具，它类似于SQLAlchemy的alembic，或者类似于Django ORM自带的迁移解决方案。
- [Loguru](https://loguru.readthedocs.io/en/stable/): 旨在为Python带来愉快的日志记录。
- [Poetry](https://python-poetry.org/docs/): Poetry是Python中用于依赖管理和打包的工具。它允许你声明你的项目所依赖的库，它会为你管理(安装/更新)它们。Poetry提供了一个锁文件，以确保可重复安装，并可以构建您的项目以进行分发。

## 问题说明

tortoise-orm使用中遇到外键无法在响应中展示问题,是因为tortoise-orm要求pydantic_model_creator在Tortoise.init之前, 而我们的
pydantic_model_creator是在注册路由时(main.register_router)通过各种路径导入进行的创建在Tortoise.init之前所以无法展示, 将register_router及app.mount
都放到lifespan中Tortoise.init之后即可解决这个问题, 但是在使用中发现自带的外键关系处理并不好用, 项目中使用了继承pydantic_model_creator
类的方式对外键关系结构进行重新定义以达到响应中展示外键相关数据的目的。

参考链接: https://tortoise.github.io/examples/pydantic.html#main-py

## 项目结构说明

- 结构由`tree -a -I "*.pyc|__pycache__|.git|.idea|.mypy_cache|logs"`命令生成

```text
├── .editorconfig                      # 编辑器配置
├── .envs                              # 环境变量配置文件目录
│   ├── .dev.example                   # 测试环境配置文件示例
│   ├── .local.example                 # 本地开发环境配置文件示例
│   └── .prod.example                  # 生产开发环境配置文件示例
├── .flake8                            # flake8配置文件, pre-commit中使用
├── .gitignore                         # git忽略管理的文件及目录
├── .isort.cfg                         # isort配置文件
├── .pre-commit-config.yaml            # pre-commit 配置文件
├── .python-version                    # python版本
├── Dockerfile                         # 用于构建docker镜像
├── README.md                          # 项目说明
├── apps                               # 业务代码目录
│   ├── __init__.py
│   ├── account                        # 账号认证相关业务
│   │   ├── __init__.py
│   │   ├── apis.py                    # 接口视图
│   │   └── models                     # 模型目录
│   │       ├── __init__.py
│   │       ├── db.py                  # 数据库模型
│   │       ├── request.py             # request模型
│   │       └── response.py            # response模型
│   └── core
│       ├── __init__.py
│       ├── apis.py
│       └── models
│           ├── __init__.py
│           ├── db.py
│           ├── request.py
│           └── response.py
├── common                             # 通用代码
│   ├── __init__.py
│   ├── authentication.py              # jwt认证
│   ├── base_pydantic.py               # pydantic模型基类
│   ├── const.py                       # 常量
│   ├── db.py                          # 数据库基类
│   ├── enums.py                       # 枚举
│   ├── exceptions                     # 异常处理
│   │   ├── __init__.py
│   │   └── handler.py
│   ├── logger.py                      # 日志初始化
│   ├── middleware                     # 中间件
│   │   ├── __init__.py
│   │   └── access_middleware.py
│   ├── response.py                    # 全局响应
│   └── utils                          # 工具包
│       └── __init__.py
├── conf                               # 配置文件
│   ├── __init__.py
│   ├── routers.py                     # 路由
│   └── settings.py                    # 项目配置
├── docker-compose.yml                 # docker-compose配置文件
├── environment.py                     # 环境变量标识
├── gunicorn.conf.py                   # gunicorn配置文件
├── main.py                            # 项目入口
├── manage.py                          # 项目关联脚本
├── migrations                         # 数据库迁移目录
│   └── models
├── poetry.lock                        # poetry文件, 用于构建python环境
├── pyproject.toml                     # poetry配置及tortoise-orm配置
├── requirements.txt                   # 项目依赖包
└── static                             # 静态文件目录
    └── .gitkeep
```

## 本地运行

运行前需先安装以下中间件:

Mysql/Sqlite、Redis、Minio

创建数据库
```sql
CREATE DATABASE ai_butler CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 修改配置文件

- 修改`environment.py`文件, 将文件中的`ENV_FLAG`修改为实际部署的环境标识如: `local`, `dev`, `prod`
- 执行`cp .envs/.{环境标识}.example .envs/.{环境标识}`命令创建环境变量配置文件

### 安装Python依赖
```shell
pip install poetry
poetry config virtualenvs.create true  # 首次使用poetry时执行
poetry install
poetry shell  # 进入虚拟环境
```

### 数据迁移
```shell
# 此命令将直接在配置好的数据库中执行migrtions中的sql
aerich upgrade
```
- 修改数据库模型文件后执行`aerich migrate`可生成新的sql, 类似django的`python manager.py makemigrations`
- 回退到上一个版本`aerich downgrade`

## 本地运行

### gunicorn运行
```shell
gunicorn main:app
```
### uvicorn运行
```shell
python main.py
```
