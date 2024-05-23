import logging
import os
import sys
from typing import Any

from loguru import logger

from conf.settings import settings

LOG_LEVEL = settings.LOG_LEVEL
LOG_STDERR_FORMAT = settings.LOG_STDERR_FORMAT
LOG_WRITE_FILE_FORMAT = settings.LOG_WRITE_FILE_FORMAT
LOG_DIR = settings.LOG_DIR
TIMEZONE = settings.TIMEZONE
os.makedirs(LOG_DIR, exist_ok=True)


class InterceptHandler(logging.Handler):
    """
    Default handler from examples in loguru documentaion.
    """

    def emit(self, record: logging.LogRecord):
        # Get corresponding Loguru level if it exists
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        # Find caller from where originated the logged message
        frame: Any = logging.currentframe()
        depth = 2
        while frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())


def init_logging():
    # 清空所有日志处理器
    logger.remove(0)
    loggers = (logging.getLogger(name) for name in logging.root.manager.loggerDict)
    for log in loggers:
        log.handlers = []

    # 重新设置日志处理器, logru接管项目日志处理
    intercept_handler = InterceptHandler()
    log_names = [
        "fastapi",
        "uvicorn",
        "uvicorn.access",
        "tortoise",
    ]
    for log_name in log_names:
        logging.getLogger(log_name).setLevel(LOG_LEVEL)
        logging.getLogger(log_name).handlers = [intercept_handler]
    # 设置终端输出日志
    if LOG_STDERR_FORMAT:
        logger.add(
            sys.stderr,
            format=LOG_STDERR_FORMAT,
            level=LOG_LEVEL,
            enqueue=True,
        )
    else:
        logger.add(
            sys.stderr,
            level=LOG_LEVEL,
            enqueue=True,
        )
    if settings.LOG_WRITE_FILE:
        # 记录运行时日志
        logger.add(
            os.path.join(LOG_DIR, "runtime{time:YYYY-MM-DD}.log"),
            encoding="utf-8",
            level=LOG_LEVEL,
            rotation="00:00",  # 每天0点轮转一次
            retention="6 months",  # 保留6个月
            enqueue=True,  # 异步安全
            backtrace=False,  # 错误跟踪
            diagnose=True,
            format=LOG_WRITE_FILE_FORMAT,
        )
        # 只记录error日志
        logger.add(
            os.path.join(LOG_DIR, "error.log"),
            encoding="utf-8",
            level="ERROR",
            rotation="500 MB",
            retention="12 months",
            enqueue=True,  # 异步安全
            backtrace=True,  # 错误跟踪
            diagnose=True,
            format=LOG_WRITE_FILE_FORMAT,
        )
