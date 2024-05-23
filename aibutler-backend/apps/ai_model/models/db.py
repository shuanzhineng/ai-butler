from common.enums import AnnotationTypeEnum, TrainStatusEnum, TrainFrameworkEnum

from tortoise import fields
from tortoise.fields.base import OnDelete

from common.db import DBBaseModel


class TrainTaskGroup(DBBaseModel):
    """训练任务组"""

    name = fields.CharField(max_length=255, description="训练任务组名称", default="")

    ai_model_type = fields.CharEnumField(
        AnnotationTypeEnum, max_length=255, description="模型类型", default=AnnotationTypeEnum.OBJECT_DETECTION
    )
    description = fields.CharField(max_length=255, description="训练任务组描述", default="")
    disabled = fields.BooleanField(description="是否禁用", default=False)

    class Meta:
        table = "train_task_group"
        table_description = "训练任务组"
        ordering = ("-id",)


class TrainTask(DBBaseModel):
    """训练任务"""

    start_datetime = fields.DatetimeField(
        null=True,
        description="训练开始时间",
    )
    end_datetime = fields.DatetimeField(
        null=True,
        description="训练结束时间",
    )
    version = fields.IntField(default=1, description="版本")
    description = fields.CharField(max_length=255, description="训练任务描述", default="")
    status = fields.CharEnumField(
        TrainStatusEnum, max_length=255, description="训练状态", default=TrainStatusEnum.WAITING
    )
    framework = fields.CharEnumField(
        TrainFrameworkEnum, max_length=255, description="训练框架", default=TrainFrameworkEnum.PYTORCH
    )
    network = fields.CharField(max_length=255, description="模型网络", default="")
    params = fields.JSONField(
        description="训练参数",
        null=True,
    )
    celery_task_id = fields.CharField(max_length=255, description="celery任务id", default="")
    base_task = fields.ForeignKeyField(
        "models.TrainTask", on_delete=OnDelete.NO_ACTION, description="基准任务", null=True, db_constraint=False
    )
    train_task_group = fields.ForeignKeyField(
        "models.TrainTaskGroup", on_delete=OnDelete.NO_ACTION, description="训练任务组", null=True, db_constraint=False
    )
    result_file = fields.ForeignKeyField(
        "models.OssFile",
        on_delete=OnDelete.NO_ACTION,
        description="结果文件",
        null=True,
        db_constraint=False,
        related_name="result_file_train_tasks",
    )
    log_file = fields.ForeignKeyField(
        "models.OssFile",
        related_name="log_file_train_tasks",
        on_delete=OnDelete.NO_ACTION,
        description="日志文件",
        null=True,
        db_constraint=False,
    )
    data_sets = fields.ManyToManyField(
        "models.DataSet",
        on_delete=OnDelete.NO_ACTION,
        description="数据集",
        db_constraint=False,
    )

    class Meta:
        table = "train_task"
        table_description = "训练任务"
        ordering = ("-id",)
