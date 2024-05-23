from contextlib import asynccontextmanager

from loguru import logger
from common.logger import init_logging

from typing import TypedDict
from onnx_predict.object_detection_predict import PredictModel as ObjectDetectionPredictModel
from onnx_predict.image_classify_predict import PredictModel as ImageClassifyPredictModel
from conf.settings import settings


class MlModel(TypedDict):
    object_detection_model: ObjectDetectionPredictModel | None
    image_classify_model: ImageClassifyPredictModel | None
    class_name: list


ml_models: MlModel = {
    "object_detection_model": None,
    "image_classify_model": None,
    "class_name": [],
}


@asynccontextmanager
async def lifespan(_):
    """
    新版本fastapi使用该方式替代startup 和shutdown 事件
    https://fastapi.tiangolo.com/advanced/events/
    如果需要初始化模型等操作应该在此方法的yield前进行并在yield后释放
    """
    # startup
    init_logging()
    logger.info("项启动信号接收成功!")
    label_path = settings.ONNX_LABEL_PATH
    onnx_weight_path = settings.ONNX_WEIGHT_PATH
    service_type = settings.SERVICE_TYPE
    confidence = settings.CONFIDENCE
    iou = settings.IOU

    if service_type == "OBJECT_DETECTION":
        with open(label_path) as f:
            labels = f.read()
        class_name = labels.split("\n")
        class_name.remove("")
        ml_models["class_name"] = class_name
        ml_models["object_detection_model"] = ObjectDetectionPredictModel(
            onnx_path=onnx_weight_path,  # 权重路径
            cls_name=class_name,  # 类别名称 list
            conf_thres=confidence,  # 置信度阈值
            iou_thres=iou,  # iou阈值
            is_gpu=settings.IS_GPU,
        )
    elif service_type == "IMAGE_CLASSIFY":
        ml_models["image_classify_model"] = ImageClassifyPredictModel(
            model_path=onnx_weight_path,  # 权重路径
            label_path=label_path,  # 类别
            # conf_thres=confidence,  # 置信度阈值
            use_gpu=settings.IS_GPU,
        )
    yield
    # shutdown
    logger.info("项目终止信号接收成功!")
