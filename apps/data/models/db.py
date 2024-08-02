from common.enums import LabelTaskStatusEnum, MediaTypeEnum, LabelTaskSampleStateEnum, AnnotationTypeEnum

from tortoise import fields
from tortoise.fields.base import OnDelete
from conf.settings import settings
from common.db import DBBaseModel


class LabelTask(DBBaseModel):
    """标注任务"""

    name = fields.CharField(description="任务名称", max_length=255)
    description = fields.CharField(description="标注任务描述", max_length=255, default="")
    tips = fields.TextField(description="标注任务提示", default="")
    config = fields.TextField(description="任务配置yaml", default="")
    media_type = fields.CharEnumField(
        MediaTypeEnum, description="数据类型", max_length=255, default=MediaTypeEnum.IMAGE
    )
    status = fields.CharEnumField(
        LabelTaskStatusEnum, description="任务状态", max_length=255, default=LabelTaskStatusEnum.DRAFT
    )
    last_sample_inner_id = fields.IntField(description="任务中样本的最后一个内部id", default=0)

    class Meta:
        table = "label_task"
        table_description = "标注任务"
        ordering = ("-id",)


class LabelTaskAttachment(DBBaseModel):
    """标注任务附件"""

    file_path = fields.CharField(description="文件path", max_length=255, default="")
    local_file_path = fields.CharField(description="本地文件path", max_length=255, default="")
    label_task = fields.ForeignKeyField(
        "models.LabelTask", on_delete=OnDelete.NO_ACTION, description="标注任务", null=True, db_constraint=False
    )

    class Meta:
        table = "label_task_attachment"
        table_description = "标注任务附件"


class LabelTaskSample(DBBaseModel):
    """标注任务样本"""

    task_attachment_ids = fields.CharField(description="任务附件id", max_length=255)
    annotated_count = fields.IntField(description="样本标注数", default=0)
    data = fields.JSONField(description="标注结果", default=dict)
    state = fields.CharEnumField(
        LabelTaskSampleStateEnum, description="标注状态", max_length=255, default=LabelTaskSampleStateEnum.NEW
    )
    label_task = fields.ForeignKeyField(
        "models.LabelTask",
        on_delete=OnDelete.NO_ACTION,
        related_name="samples",
        description="标注任务",
        null=True,
        db_constraint=False,
    )

    class Meta:
        table = "label_task_sample"
        table_description = "标注任务样本"


class OssFile(DBBaseModel):
    """对象存储文件"""

    bucket = fields.CharField(max_length=255, description="数据桶", default=settings.MINIO_DEFAULT_BUCKET)
    server_address = fields.CharField(
        max_length=255, description="存储服务地址", default=f"{settings.MINIO_SERVER_HOST}:{settings.MINIO_SERVER_PORT}"
    )

    path = fields.CharField(
        max_length=255,
        description="存储路径",
    )
    filename = fields.CharField(max_length=255, description="文件名", default="")
    file_size = fields.IntField(description="文件大小", null=True, default=None)

    class Meta:
        table = "oss_file"
        table_description = "云存储文件"


class DataSetGroup(DBBaseModel):
    """数据集组"""

    name = fields.CharField(
        max_length=255,
        description="数据集组名称",
    )
    description = fields.CharField(max_length=255, description="数据集组描述", default="")
    disabled = fields.BooleanField(description="是否禁用", default=False)
    data_type = fields.CharEnumField(MediaTypeEnum, max_length=255, description="数据类型", default=MediaTypeEnum.IMAGE)
    annotation_type = fields.CharEnumField(
        AnnotationTypeEnum, max_length=255, description="数据类型", default=AnnotationTypeEnum.OBJECT_DETECTION
    )

    class Meta:
        table = "data_set_group"
        table_description = "数据集组"
        ordering = ("-id",)


class DataSet(DBBaseModel):
    """数据集"""

    version = fields.IntField(default=1, description="数据集版本")
    description = fields.CharField(max_length=255, description="数据集描述", default="")
    data_set_group = fields.ForeignKeyField(
        "models.DataSetGroup",
        on_delete=OnDelete.NO_ACTION,
        description="数据集组",
        db_constraint=False,
        related_name="data_sets",
    )
    file = fields.ForeignKeyField(
        "models.OssFile",
        on_delete=OnDelete.NO_ACTION,
        description="文件",
        db_constraint=False,
        related_name="data_sets",
        null=True,
    )

    class Meta:
        table = "data_set"
        table_description = "数据集"
        ordering = ("-id",)
