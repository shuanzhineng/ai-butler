from functools import lru_cache

from pydantic_settings import BaseSettings


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

    USE_TZ: bool = False
    TIMEZONE: str = "Asia/Shanghai"
    MIDDLEWARE_CORS: bool = True  # 是否开启跨域

    # 将所有response_model中的时间按照此格式输出
    DATETIME_FORMAT: str = "%Y-%m-%d %H:%M:%S"  # 日期时间格式配置
    DATE_FORMAT: str = "%Y-%m-%d"  # 日期时间格式配置

    ALLOW_ORIGINS: list[str] = ["*"]  # 允许访问的域名

    # 日志
    LOG_LEVEL: str = "DEBUG"
    LOG_DIR: str = "logs/"  # 日志存储目录

    LOG_WRITE_FILE: bool = True
    LOG_WRITE_FILE_FORMAT: str = "{time:YYYY-MM-DD HH:mm:ss} | {level} | {file}.{function}:{line} | {message}"
    # 不修建议修改控制台的format, loguru默认带的format
    # 可以基本满足需求, 且每种级别区分了不同颜色
    LOG_STDERR_FORMAT: str | None = None
    # 是否使用gpu
    IS_GPU: bool = False
    ONNX_WEIGHT_PATH: str = "onnx_weight/best.onnx"
    ONNX_LABEL_PATH: str = "onnx_weight/classes.txt"
    # 分类或者检测
    SERVICE_TYPE: str = "OBJECT_DETECTION"  # IMAGE_CLASSIFY
    CONFIDENCE: float = 0.4
    IOU: float = 0.4

    AUTHENTICATION_TOKEN: str

    class Config:
        env_file = ".envs"


@lru_cache
def get_settings() -> Settings:
    """读取配置优化写法, 全局共享"""
    return Settings()  # type: ignore


settings = get_settings()
