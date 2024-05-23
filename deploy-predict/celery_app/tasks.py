from ai_butler_sdk.celery_app import celery_app
from ai_butler_sdk.deploy_onnx import DeployOnnxInfer
import enum

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


@celery_app.task
def deploy_onnx_infer_by_train_task(
    deploy_id: str, inner_token: str, train_result_url: str | None = None, is_gpu: bool = False,
    service_type: AnnotationTypeEnum = AnnotationTypeEnum.OBJECT_DETECTION
):
    deploy_onnx_infer = DeployOnnxInfer(deploy_id, inner_token, train_result_url, service_type, is_gpu)
    deploy_onnx_infer()
