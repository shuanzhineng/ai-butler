from common.enums import DeployOnlineInferStatusEnum
from tortoise import fields
from tortoise.fields.base import OnDelete

from common.db import DBBaseModel


class DeployOnlineInfer(DBBaseModel):
    """模型在线服务"""

    name = fields.CharField(max_length=255, description="名称", default="")
    description = fields.CharField(max_length=255, description="描述", default="")
    status = fields.CharEnumField(
        DeployOnlineInferStatusEnum, max_length=255, description="状态", default=DeployOnlineInferStatusEnum.WAITING
    )
    reason = fields.TextField(description="失败原因", default="")
    token = fields.CharField(description="令牌", max_length=255)
    is_gpu = fields.BooleanField(description="是否gpu部署", default=False)
    infer_address = fields.CharField(max_length=255, description="推理地址", default="")
    celery_task_id = fields.CharField(max_length=255, description="异步任务id", default="")
    train_task = fields.ForeignKeyField(
        "models.TrainTask", on_delete=OnDelete.NO_ACTION, description="训练任务", null=True, db_constraint=False
    )

    class Meta:
        table = "deploy_online_infer"
        table_description = "部署在线推理"
        ordering = ("-id",)
