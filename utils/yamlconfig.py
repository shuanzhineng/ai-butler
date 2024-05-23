# "-*- coding:UTF-8 -*-
import yaml
from pydantic import BaseModel, Field
from typing import List


class COCO128(BaseModel):
    """data/coco128.yaml"""
    path: str = Field("../datasets/coco128", description="数据集路径")
    train: str = Field("images/train", description="训练集路径，可以这么写，也可以直接写全路径")
    val: str = Field("images/val", description="验证集路径，可以这么写，也可以写全路径")
    test: str = Field("images/test", description="测试集路径，可以这么写，也可以写全路径")
    nc: int = Field(80, description="number of classes 类别数量")
    names: List[str] = Field([
        'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat', 'traffic light',
        'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse', 'sheep', 'cow',
        'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee',
        'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard',
        'tennis racket', 'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
        'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch',
        'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote', 'keyboard',
        'cell phone', 'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'book', 'clock', 'vase', 'scissors',
        'teddy bear', 'hair drier', 'toothbrush'
    ], description="number of classes")
    # download: str = Field("https://ultralytics.com/assets/coco128.zip", description="默认下载的数据集")


class HypScratch(BaseModel):
    """默认使用data/hyps/hyp-scratch-low.yaml"""
    lr0: float = Field(0.01, description="initial learning rate (SGD=1E-2, Adam=1E-3")
    lrf: float = Field(0.01, description="final OneCycleLR learning rate (lr0 * lrf)")
    momentum: float = Field(0.937, description="SGD momentum/Adam beta1")
    weight_decay: float = Field(0.0005, description="optimizer weight decay 5e-4")
    warmup_epochs: float = Field(3.0, description="warmup epochs (fractions ok)")
    warmup_momentum: float = Field(0.8, description="warmup initial momentum")
    warmup_bias_lr: float = Field(0.1, description="warmup initial bias lr")
    box: float = Field(0.05, description="box loss gain")
    cls: float = Field(0.5, description="cls loss gain")
    cls_pw: float = Field(1.0, description="cls BCELoss positive_weight")
    obj: float = Field(1.0, description="obj loss gain (scale with pixels)")
    obj_pw: float = Field(1.0, description="obj BCELoss positive_weight")
    iou_t: float = Field(0.20, description="IoU training threshold")
    anchor_t: float = Field(4.0, description="anchor-multiple threshold")
    # anchors: 3  # anchors per output layer (0 to ignore)
    fl_gamma: float = Field(0.0, description="focal loss gamma (efficientDet default gamma=1.5)")
    hsv_h: float = Field(0.015, description="image HSV-Hue augmentation (fraction)")
    hsv_s: float = Field(0.7, description="image HSV-Saturation augmentation (fraction)")
    hsv_v: float = Field(0.4, description="image HSV-Value augmentation (fraction)")
    degrees: float = Field(0.0, description="image rotation (+/- deg)")
    translate: float = Field(0.1, description="image translation (+/- fraction)")
    scale: float = Field(0.5, description="image scale (+/- gain)")
    shear: float = Field(0.0, description="image shear (+/- deg)")
    perspective: float = Field(0.0, description="image perspective (+/- fraction), range 0-0.001")
    flipud: float = Field(0.0, description="image flip up-down (probability)")
    fliplr: float = Field(0.5, description="image flip left-right (probability)")
    mosaic: float = Field(1.0, description="image mosaic (probability)")
    mixup: float = Field(0.0, description="image mixup (probability)")
    copy_paste: float = Field(0.0, description="segment copy-paste (probability)")


class HypScratchLow(BaseModel):
    """data/hyps/hyp-scratch-low.yaml"""
    lr0: float = Field(0.01, description="initial learning rate (SGD=1E-2, Adam=1E-3")
    lrf: float = Field(0.01, description="final OneCycleLR learning rate (lr0 * lrf)")
    momentum: float = Field(0.937, description="SGD momentum/Adam beta1")
    weight_decay: float = Field(0.0005, description="optimizer weight decay 5e-4")
    warmup_epochs: float = Field(3.0, description="warmup epochs (fractions ok)")
    warmup_momentum: float = Field(0.8, description="warmup initial momentum")
    warmup_bias_lr: float = Field(0.1, description="warmup initial bias lr")
    box: float = Field(0.05, description="box loss gain")
    cls: float = Field(0.5, description="cls loss gain")
    cls_pw: float = Field(1.0, description="cls BCELoss positive_weight")
    obj: float = Field(1.0, description="obj loss gain (scale with pixels)")
    obj_pw: float = Field(1.0, description="obj BCELoss positive_weight")
    iou_t: float = Field(0.20, description="IoU training threshold")
    anchor_t: float = Field(4.0, description="anchor-multiple threshold")
    # anchors: 3  # anchors per output layer (0 to ignore)
    fl_gamma: float = Field(0.0, description="focal loss gamma (efficientDet default gamma=1.5)")
    hsv_h: float = Field(0.015, description="image HSV-Hue augmentation (fraction)")
    hsv_s: float = Field(0.7, description="image HSV-Saturation augmentation (fraction)")
    hsv_v: float = Field(0.4, description="image HSV-Value augmentation (fraction)")
    degrees: float = Field(0.0, description="image rotation (+/- deg)")
    translate: float = Field(0.1, description="image translation (+/- fraction)")
    scale: float = Field(0.5, description="image scale (+/- gain)")
    shear: float = Field(0.0, description="image shear (+/- deg)")
    perspective: float = Field(0.0, description="image perspective (+/- fraction), range 0-0.001")
    flipud: float = Field(0.0, description="image flip up-down (probability)")
    fliplr: float = Field(0.5, description="image flip left-right (probability)")
    mosaic: float = Field(1.0, description="image mosaic (probability)")
    mixup: float = Field(0.0, description="image mixup (probability)")
    copy_paste: float = Field(0.0, description="segment copy-paste (probability)")


class HypScratchMed(BaseModel):
    """data/hyps/hyp-scratch-med.yaml"""

    lr0: float = Field(0.01, description=" initial learning rate (SGD=1E-2, Adam=1E-3)")
    lrf: float = Field(0.1, description=" final OneCycleLR learning rate (lr0 * lrf)")
    momentum: float = Field(0.937, description=" SGD momentum/Adam beta1")
    weight_decay: float = Field(0.0005, description=" optimizer weight decay 5e-4")
    warmup_epochs: float = Field(3.0, description=" warmup epochs (fractions ok)")
    warmup_momentum: float = Field(0.8, description=" warmup initial momentum")
    warmup_bias_lr: float = Field(0.1, description=" warmup initial bias lr")
    box: float = Field(0.05, description=" box loss gain")
    cls: float = Field(0.3, description=" cls loss gain")
    cls_pw: float = Field(1.0, description=" cls BCELoss positive_weight")
    obj: float = Field(0.7, description=" obj loss gain (scale with pixels)")
    obj_pw: float = Field(1.0, description=" obj BCELoss positive_weight")
    iou_t: float = Field(0.20, description=" IoU training threshold")
    anchor_t: float = Field(4.0, description=" anchor-multiple threshold")
    # anchors: 3  # anchors per output layer (0 to ignore)
    fl_gamma: float = Field(0.0, description=" focal loss gamma (efficientDet default gamma=1.5)")
    hsv_h: float = Field(0.015, description=" image HSV-Hue augmentation (fraction)")
    hsv_s: float = Field(0.7, description=" image HSV-Saturation augmentation (fraction)")
    hsv_v: float = Field(0.4, description=" image HSV-Value augmentation (fraction)")
    degrees: float = Field(0.0, description=" image rotation (+/- deg)")
    translate: float = Field(0.1, description=" image translation (+/- fraction)")
    scale: float = Field(0.9, description=" image scale (+/- gain)")
    shear: float = Field(0.0, description=" image shear (+/- deg)")
    perspective: float = Field(0.0, description=" image perspective (+/- fraction), range 0-0.001")
    flipud: float = Field(0.0, description=" image flip up-down (probability)")
    fliplr: float = Field(0.5, description=" image flip left-right (probability)")
    mosaic: float = Field(1.0, description=" image mosaic (probability)")
    mixup: float = Field(0.1, description=" image mixup (probability)")
    copy_paste: float = Field(0.0, description=" segment copy-paste (probability)")


class HypScratchHigh(BaseModel):
    """data/hyps/hyp-scratch-high.yaml"""
    lr0: float = Field(0.01, description=" initial learning rate (SGD=1E-2, Adam=1E-3)")
    lrf: float = Field(0.1, description=" final OneCycleLR learning rate (lr0 * lrf)")
    momentum: float = Field(0.937, description=" SGD momentum/Adam beta1")
    weight_decay: float = Field(0.0005, description=" optimizer weight decay 5e-4")
    warmup_epochs: float = Field(3.0, description=" warmup epochs (fractions ok)")
    warmup_momentum: float = Field(0.8, description=" warmup initial momentum")
    warmup_bias_lr: float = Field(0.1, description=" warmup initial bias lr")
    box: float = Field(0.05, description=" box loss gain")
    cls: float = Field(0.3, description=" cls loss gain")
    cls_pw: float = Field(1.0, description=" cls BCELoss positive_weight")
    obj: float = Field(0.7, description=" obj loss gain (scale with pixels)")
    obj_pw: float = Field(1.0, description=" obj BCELoss positive_weight")
    iou_t: float = Field(0.20, description=" IoU training threshold")
    anchor_t: float = Field(4.0, description=" anchor-multiple threshold")
    # anchors: 3  # anchors per output layer (0 to ignore)
    fl_gamma: float = Field(0.0, description=" focal loss gamma (efficientDet default gamma=1.5)")
    hsv_h: float = Field(0.015, description=" image HSV-Hue augmentation (fraction)")
    hsv_s: float = Field(0.7, description=" image HSV-Saturation augmentation (fraction)")
    hsv_v: float = Field(0.4, description=" image HSV-Value augmentation (fraction)")
    degrees: float = Field(0.0, description=" image rotation (+/- deg)")
    translate: float = Field(0.1, description=" image translation (+/- fraction)")
    scale: float = Field(0.9, description=" image scale (+/- gain)")
    shear: float = Field(0.0, description=" image shear (+/- deg)")
    perspective: float = Field(0.0, description=" image perspective (+/- fraction), range 0-0.001")
    flipud: float = Field(0.0, description=" image flip up-down (probability)")
    fliplr: float = Field(0.5, description=" image flip left-right (probability)")
    mosaic: float = Field(1.0, description=" image mosaic (probability)")
    mixup: float = Field(0.1, description=" image mixup (probability)")
    copy_paste: float = Field(0.1, description=" segment copy-paste (probability)")


def read_yaml(yaml_file: str = "data/coco128.yaml"):
    with open(yaml_file, encoding="ascii", errors="ignore") as f:
        yaml_result = yaml.safe_load(f)
    return yaml_result


def write_yaml(yaml_file: str = "data/coco128_2.yaml"):
    with open(yaml_file, "w") as f:
        yaml.safe_dump(coco128.dict(), f, default_flow_style=False)


coco128 = COCO128()
# 默认使用的参数
hyp_scratch = HypScratch()

if __name__ == '__main__':
    # with open("data/coco128.yaml", encoding="ascii", errors="ignore") as f:
    #     coco128 = yaml.safe_load(f)
    # print(coco128)
    with open('data/coco128_2.yaml', "w") as f:
        yaml.safe_dump(coco128.dict(), f, default_flow_style=False)
