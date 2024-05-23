from celery_app import celery_app
from common.enums import AnnotationTypeEnum


@celery_app.task
def pytorch_object_detection_train(
    train_task_id: str,
    network: str,
    data_set_urls: list[str],
    train_params: dict,
    log_upload_url: str,
    model_weight_upload_url: str,
    pretrain_model_weight_download_url: str | None = None,
):
    """仅用名字占位即可, 具体的业务放到worker端实现"""
    pass


@celery_app.task
def paddle_image_classify_train(
    train_task_id: str,
    network: str,
    data_set_urls: list[str],
    train_params: dict,
    log_upload_url: str,
    model_weight_upload_url: str,
    pretrain_model_weight_download_url: str | None = None,
):
    """仅用名字占位即可, 具体的业务放到worker端实现"""
    pass


@celery_app.task
def deploy_onnx_infer_by_train_task(
    deploy_id: str,
    inner_token: str,
    train_result_url: str | None = None,
    is_gpu: bool = False,
    service_type: str = AnnotationTypeEnum.OBJECT_DETECTION.value,
):
    """仅用名字占位即可, 具体的业务放到worker端实现"""
    pass
