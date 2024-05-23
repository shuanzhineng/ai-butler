from common.base_pydantic import CustomBaseModel
from pydantic import Field, field_validator
from common.enums import AnnotationTypeEnum, TrainFrameworkEnum
from typing import Literal
from common.const import PYTORCH_OBJECT_DETECTION_NETWORKS


class TrainTaskGroupIn(CustomBaseModel):
    name: str = Field(min_length=1, max_length=50)
    ai_model_type: AnnotationTypeEnum
    description: str = Field(min_length=0, max_length=200, default="")


class PutTrainTaskGroupIn(CustomBaseModel):
    name: str = Field(min_length=1, max_length=50)
    description: str = Field(min_length=0, max_length=200, default="")


class PytorchObjectDetectionTrainParams(CustomBaseModel):
    """训练参数"""

    train_data_ratio: float = 0.8  # 训练集比例
    epochs: int = 100  # epochs: 训练多少epochs停止（带有早停机制）
    batch_size: int = 16  # batch size: 批次
    imgsz: int = 224  # 训练图片大小： 使用32的倍数，建议大于112, 常见值224,384,426, 640,1024
    save_period: int = -1  # 每多少轮保存权重：这里可以不做修改，使用默认值；如果要修改，save_period < epochs
    seed: int = 0  # 随机种子：可以使用任务id，保证每次训练同样一批数据结果接近，也可以不做修改，使用默认值即可
    device: Literal["0", "cpu"] = "0"
    multi_scale: bool = False  # 多尺度训练: False 关闭多尺度, True 开启多尺度
    workers: int = 0  # 线程数：数据加载使用的线程数，linux环境下使用，建议不要太高，平常训练建议值2,4,8
    cos_lr: bool = False  # 预先学习率: [使用默认值]调参操作,是否使用标签学习率，使用默认值
    label_smoothing: float = 0.0  # 标签平滑参数：取值范围[0.0,1.0]   调参操作：是否使用标签平滑，使用默认值
    freeze: list[int] = [0]  # 冻结权重取值范围[[0],[10]] 是否选用冻结权重，高阶操作，使用默认值，不做修改
    optimizer: Literal["SGD", "Adam", "AdamW"] = "SGD"  # 优化器： 高阶调参操作
    train_hyp_params: dict = {}  # 训练超参


class TrainTaskIn(CustomBaseModel):
    description: str = Field(min_length=0, max_length=200, default="")
    base_task_id: int | None = None
    data_set_ids: list = []
    ai_model_type: AnnotationTypeEnum
    framework: TrainFrameworkEnum
    network: str
    params: dict

    @field_validator("network")
    @staticmethod
    def validate_network(v, values):
        framework = values.data.get("framework")
        ai_model_type = values.data.get("ai_model_type")
        if framework == TrainFrameworkEnum.PYTORCH:
            if ai_model_type == AnnotationTypeEnum.OBJECT_DETECTION:
                if v not in PYTORCH_OBJECT_DETECTION_NETWORKS:
                    raise ValueError(f"network 值 {v} 不在可选范围 {PYTORCH_OBJECT_DETECTION_NETWORKS} 内")
        # TODO 其他模型待补充
        return v

    @field_validator("params")
    @staticmethod
    def validate_params(v, values):
        framework = values.data.get("framework")
        ai_model_type = values.data.get("ai_model_type")
        if framework == TrainFrameworkEnum.PYTORCH:
            if ai_model_type == AnnotationTypeEnum.OBJECT_DETECTION:
                return PytorchObjectDetectionTrainParams(**v).model_dump()
        # TODO 其他模型待补充
        return v
