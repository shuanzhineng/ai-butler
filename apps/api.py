from fastapi import APIRouter, UploadFile, Body, Depends
import cv2
import numpy as np
from common.lifespan import ml_models
import httpx
import base64
from pydantic import BaseModel
from common.depends import TokenAuthorization
from fastapi.security import HTTPBearer

router = APIRouter(
    prefix="/object-detectors",
    tags=["物体检测"],
    responses={404: {"description": "Not found"}},
)

router2 = APIRouter(
    prefix="/image-classifiers",
    tags=["图像分类"],
    responses={404: {"description": "Not found"}},
)

http_bearer = HTTPBearer()


class ObjectDetectionPredictResult(BaseModel):
    xyxy: list[float]
    confidence: float
    label: str


@router.post(
    "/to-xyxy/from-file",
    summary="接收文件返回检测到的物体坐标",
    response_model=list[ObjectDetectionPredictResult],
    dependencies=[Depends(TokenAuthorization())],
)
async def image_detection_to_xyxy_from_file(file: UploadFile):
    assert ml_models["object_detection_model"]
    image = cv2.imdecode(np.frombuffer(await file.read(), np.uint8), cv2.IMREAD_COLOR)
    _, out_labels = ml_models["object_detection_model"].detect(image)
    output = []
    for label in out_labels:
        d = {
            "xyxy": label[:4],
            "confidence": round(float(label[4]), 4),
            "label": ml_models["class_name"][int(label[-1])],
        }
        output.append(d)
    return output


@router.post(
    "/to-xyxy/from-url",
    summary="接收图片url返回检测到的物体坐标",
    response_model=list[ObjectDetectionPredictResult],
    dependencies=[Depends(TokenAuthorization())],
)
def image_detection_to_xyxy_from_url(image_url: str = Body(embed=True)):
    assert ml_models["object_detection_model"]
    resp = httpx.get(image_url, verify=False)
    image = cv2.imdecode(np.frombuffer(resp.content, np.uint8), cv2.IMREAD_COLOR)
    _, out_labels = ml_models["object_detection_model"].detect(image)
    output = []
    for label in out_labels:
        d = {
            "xyxy": label[:4],
            "confidence": round(float(label[4]), 4),
            "label": ml_models["class_name"][int(label[-1])],
        }
        output.append(d)
    return output


@router.post(
    "/to-xyxy/from-base64",
    summary="接收图片base64返回检测到的物体坐标",
    response_model=list[ObjectDetectionPredictResult],
    dependencies=[Depends(TokenAuthorization())],
)
def image_detection_to_xyxy_from_base64(image_base64: str = Body(embed=True)):
    assert ml_models["object_detection_model"]
    content = base64.b64decode(image_base64)
    image = cv2.imdecode(np.frombuffer(content, np.uint8), cv2.IMREAD_COLOR)
    _, out_labels = ml_models["object_detection_model"].detect(image)
    output = []
    for label in out_labels:
        d = {
            "xyxy": label[:4],
            "confidence": round(float(label[4]), 4),
            "label": ml_models["class_name"][int(label[-1])],
        }
        output.append(d)
    return output


# --------------------------- 图像分类 ---------------------------


class ImageClassifyPredictResult(BaseModel):
    confidence: float
    label: str


@router2.post(
    "/to-classes/from-file",
    summary="接收文件返回分类结果",
    response_model=list[ImageClassifyPredictResult],
    dependencies=[Depends(TokenAuthorization())],
)
async def image_classify_to_classes_from_file(file: UploadFile):
    assert ml_models["image_classify_model"]
    image = cv2.imdecode(np.frombuffer(await file.read(), np.uint8), cv2.IMREAD_COLOR)
    out_labels = ml_models["image_classify_model"].onnx_predict(image)
    return out_labels


@router2.post(
    "/to-classes/from-url",
    summary="接收图片url返回分类结果",
    response_model=list[ImageClassifyPredictResult],
    dependencies=[Depends(TokenAuthorization())],
)
def image_classify_to_classes_from_url(image_url: str = Body(embed=True)):
    assert ml_models["image_classify_model"]
    resp = httpx.get(image_url, verify=False)
    image = cv2.imdecode(np.frombuffer(resp.content, np.uint8), cv2.IMREAD_COLOR)
    out_labels = ml_models["image_classify_model"].onnx_predict(image)
    return out_labels


@router2.post(
    "/to-classes/from-base64",
    summary="接收图片base64返回分类结果",
    response_model=list[ImageClassifyPredictResult],
    dependencies=[Depends(TokenAuthorization())],
)
def image_classify_to_classes_from_base64(image_base64: str = Body(embed=True)):
    assert ml_models["image_classify_model"]
    content = base64.b64decode(image_base64)
    image = cv2.imdecode(np.frombuffer(content, np.uint8), cv2.IMREAD_COLOR)
    out_labels = ml_models["image_classify_model"].onnx_predict(image)
    return out_labels
