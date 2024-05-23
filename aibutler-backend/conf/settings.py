from functools import lru_cache

from pydantic_settings import BaseSettings

from environment import ENV_FLAG


class Settings(BaseSettings):
    """配置类"""

    # FastAPI
    # TITLE: str = "FastAPI"
    # VERSION: str = "v0.0.1"
    # DESCRIPTION: str = (
    #     "fastapi_template. 🚀  点击跳转 -> "
    #     "[master](https://github.com/lvshaoyuan/fastapi-template.git)"
    # )
    # DOCS_URL: str = "/v1/docs"
    # OPENAPI_URL: str = "/v1/openapi"
    # REDOCS_URL: str = ""
    # 时区
    # 静态文件代理
    STATIC_FILE: bool = True  # 是否使用静态文件服务
    STATIC_PATH: str = "/static"  # 静态文件访问路径
    STATIC_DIR: str = "static"  # 静态文件存放目录

    DB_URL: str | None = None
    USE_TZ: bool = False
    TIMEZONE: str = "Asia/Shanghai"
    # 将所有response_model中的时间按照此格式输出
    DATETIME_FORMAT: str = "%Y-%m-%d %H:%M:%S"  # 日期时间格式配置
    DATE_FORMAT: str = "%Y-%m-%d"  # 日期时间格式配置

    TORTOISE_ORM_MODELS: list[str] = [
        # "apps.account.models.db",
        "apps.system.models.db",
        "apps.data.models.db",
        "apps.ai_model.models.db",
        "apps.application.models.db",
    ]

    # Redis
    REDIS_URL: str | None = None

    # 中间件
    MIDDLEWARE_CORS: bool = True  # 是否开启跨域
    ALLOW_ORIGINS: list[str] = ["*"]  # 允许访问的域名

    # 日志
    LOG_LEVEL: str = "DEBUG"
    LOG_DIR: str = "logs/"  # 日志存储目录

    LOG_WRITE_FILE: bool = True
    LOG_WRITE_FILE_FORMAT: str = "{time:YYYY-MM-DD HH:mm:ss} | {level} | {file}.{function}:{line} | {message}"
    # 不修建议修改控制台的format, loguru默认带的format
    # 可以基本满足需求, 且每种级别区分了不同颜色
    LOG_STDERR_FORMAT: str | None = None

    # jwt认证
    SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    TOKEN_URL: str = "/account/oauth2/token"

    # minio
    MINIO_DEFAULT_BUCKET: str = "ai-butler"
    MINIO_SERVER_HOST: str = ""
    MINIO_SERVER_PORT: str = ""
    MINIO_ACCESS_KEY: str = ""
    MINIO_SECRET_KEY: str = ""

    INNER_AUTHENTICATION_TOKEN: str
    # celery
    CELERY_BROKER_URL: str | None = REDIS_URL

    class Config:
        env_file = f".envs/.{ENV_FLAG}"


@lru_cache
def get_settings() -> Settings:
    """读取配置优化写法, 全局共享"""
    return Settings()  # type: ignore


settings = get_settings()

AERICH_TORTOISE_ORM_CONFIG = {
    "connections": {
        "default": settings.DB_URL,
    },
    "apps": {
        "models": {
            "models": ["aerich.models"] + settings.TORTOISE_ORM_MODELS,
            "default_connection": "default",
        }
    },
    # 建议不要开启，不然存储日期时会有很多坑，时区转换在项目中手动处理更稳妥。
    "use_tz": settings.USE_TZ,
    "timezone": settings.TIMEZONE,
}
