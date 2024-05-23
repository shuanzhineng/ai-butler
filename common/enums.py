"""
项目Enum
"""
import enum


class APIMethodEnum(str, enum.Enum):
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    PATCH = "PATCH"
    DELETE = "DELETE"


class DataScopeEnum(enum.IntEnum):
    ONLY_SELF = 0
    ONLY_DEPARTMENT = 1
    SELF_AND_SUBORDINATES = 2
    CUSTOM = 3
    ALL = 99

    @classmethod
    def get_display(cls, key):
        d = {
            0: "仅自己",
            1: "本部门",
            2: "本部门及下级部门",
            3: "自定义",
            99: "全部",
        }
        return d[key]


class MenuGenreEnum(str, enum.Enum):
    """菜单类型"""

    DIRECTORY = "DIRECTORY"
    PAGE = "PAGE"
    BUTTON = "BUTTON"

    @classmethod
    def get_display(cls, key):
        d = {
            "DIRECTORY": "目录",
            "PAGE": "页面",
            "BUTTON": "按钮",
        }
        return d[key]


class LabelTaskStatusEnum(str, enum.Enum):
    """数据质检状态"""

    DRAFT = "DRAFT"
    IMPORTED = "IMPORTED"
    CONFIGURED = "CONFIGURED"
    INPROGRESS = "INPROGRESS"
    FINISHED = "FINISHED"

    @classmethod
    def get_display(cls, key):
        d = {
            "DRAFT": "初始化",
            "IMPORTED": "已导入",
            "CONFIGURED": "已配置",
            "INPROGRESS": "进行中",
            "FINISHED": "已完成",
        }
        return d[key]


class MediaTypeEnum(str, enum.Enum):
    """标注任务媒体类型"""

    IMAGE = "IMAGE"
    VIDEO = "VIDEO"
    AUDIO = "AUDIO"

    @classmethod
    def get_display(cls, key):
        d = {
            "IMAGE": "图片",
            "VIDEO": "视频",
            "AUDIO": "音频",
        }
        return d[key]


class LabelTaskSampleStateEnum(str, enum.Enum):
    """标注任务样例状态"""

    NEW = "NEW"
    SKIPPED = "SKIPPED"
    DONE = "DONE"

    @classmethod
    def get_display(cls, key):
        d = {
            "NEW": "未标注",
            "SKIPPED": "跳过",
            "DONE": "已标注",
        }
        return d[key]


class AnnotationTypeEnum(str, enum.Enum):
    """
    标注类型
    """

    IMAGE_CLASSIFY = "IMAGE_CLASSIFY"  # 图像分类
    OBJECT_DETECTION = "OBJECT_DETECTION"  # 物体检测

    @classmethod
    def get_display(cls, key):
        d = {
            "IMAGE_CLASSIFY": "图像分类",
            "OBJECT_DETECTION": "物体检测",
        }
        return d[key]


class TrainStatusEnum(str, enum.Enum):
    """
    训练状态
    """

    WAITING = "WAITING"
    TRAINING = "TRAINING"
    FAILURE = "FAILURE"
    FINISH = "FINISH"

    @classmethod
    def get_display(cls, key):
        d = {
            "WAITING": "等待训练",
            "TRAINING": "训练中",
            "FAILURE": "已失败",
            "FINISH": "已完成",
        }
        return d[key]


class DeployOnlineInferStatusEnum(str, enum.Enum):
    """
    部署在线推理服务的状态
    """

    WAITING = "WAITING"
    DEPLOYING = "DEPLOYING"
    FAILURE = "FAILURE"
    FINISH = "FINISH"

    @classmethod
    def get_display(cls, key):
        d = {
            "WAITING": "等待部署",
            "DEPLOYING": "部署中",
            "FAILURE": "已失败",
            "FINISH": "已完成",
        }
        return d[key]


class CeleryWorkerGenreEnum(str, enum.Enum):
    """
    celery worker类型
    """

    train = "train"
    verify = "verify"
    FAILURE = "FAILURE"
    FINISH = "FINISH"

    @classmethod
    def get_display(cls, key):
        d = {
            "WAITING": "等待训练",
            "TRAINING": "训练中",
            "FAILURE": "已失败",
            "FINISH": "已完成",
        }
        return d[key]


class TrainFrameworkEnum(str, enum.Enum):
    """
    训练框架
    """

    PYTORCH = "PyTorch"
    PADDLEPADDLE = "PaddlePaddle"
