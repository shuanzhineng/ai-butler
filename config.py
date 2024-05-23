# -*- coding:UTF-8 -*-
from pydantic import BaseModel, Field
import pathlib
import os
import time


class Config(BaseModel):
    # 默认参数
    root: str = pathlib.Path(__file__).parent  # 工程根目录
    train_log_name: str = f"train_log_{int(time.time())}.log"
    train_log_dir: str = os.path.join(root, "logs")
    os.makedirs(train_log_dir, exist_ok=True)
    train_log_path: str = os.path.join(train_log_dir, train_log_name)


class TrainParams(BaseModel):
    # 训练参数
    weights: str = Field('weights/yolov5s.pt', description="修改:initial weights path")
    cfg: str = Field('models/yolov5s.yaml', description="修改:model.yaml path")
    data: str = Field('data/coco128.yaml', description="生成修改:dataset.yaml path")
    hyp: str = Field('data/hyps/hyp.scratch-low.yaml', description="修改:hyperparameters path")
    epochs: int = Field(300, description="train epoch")
    batch_size: int = Field(16, description="total batch size for all GPUs, -1 for autobatch")
    imgsz: int = Field(640, description="train, val image size (pixels)")
    rect: bool = Field(False, description="rectangular training")
    resume: bool = Field(False, description="resume most recent training")
    nosave: bool = Field(False, description="only save final checkpoint")
    noval: bool = Field(False, description="only validate final epoch")
    noautoanchor: bool = Field(False, description="disable AutoAnchor")
    noplots: bool = Field(False, description="save no plot files")
    evolve: bool = Field(None, description="evolve hyperparameters for x generations")
    bucket: str = Field('', description="gsutil bucket")
    cache: str = Field(None, description="--cache images in ram (default) or disk")
    image_weights: bool = Field(False, description="use weighted image selection for training")
    device: str = Field('', description="前端传入：cuda device, i.e. 0 or 0,1,2,3 or cpu")
    multi_scale: bool = Field(False, description="前端传入：vary img-size +/- 50%%")
    single_cls: bool = Field(False, description="train multi-class data as single-class")
    optimizer: str = Field('SGD', description="前端传入：optimizer['SGD', 'Adam', 'AdamW']")
    sync_bn: bool = Field(False, description="use SyncBatchNorm, only available in DDP mode")
    workers: int = Field(8, description="前端传入：max dataloader workers (per RANK in DDP mode)")
    save_dir: str = Field('runs/train/exp', description="修改:save to project/name")
    project: str = Field('runs/train', description="修改:save to project/name")
    name: str = Field('exp', description="修改:save to project/name")
    exist_ok: bool = Field(False, description="existing project/name ok, do not increment")
    quad: bool = Field(False, description="quad dataloader")
    cos_lr: bool = Field(False, description="前端传入：cosine LR scheduler")
    label_smoothing: float = Field(0.0, description="前端传入：Label smoothing epsilon")
    patience: int = Field(100, description="前端传入：EarlyStopping patience (epochs without improvement)")
    freeze: list = Field([0], description="前端传入：Freeze layers: backbone=10, first3=0 1 2")
    save_period: int = Field(-1, description="前端传入：Save checkpoint every x epochs (disabled if < 1)")
    seed: int = Field(0, description="前端传入：Global training seed")
    local_rank: int = Field(-1, description="前端传入：Automatic DDP Multi-GPU argument, do not modify")
    entity: object = Field(None, description="W&B: Entity")
    upload_dataset: bool = Field(False, description="W&B: Upload data, val option")
    bbox_interval: int = Field(-1, description="W&B: Set bounding-box image logging interval")
    artifact_alias: str = Field('latest', description="W&B: Version of dataset artifact to use")


opt = Config()

MODEL_NAME_TRAIN_DICT = {
    "yolov5n": {
        "weights": os.path.join(opt.root, "weights/yolov5n.pt"),
        "cfg": os.path.join(opt.root, "models/yolov5n.yaml"),
        "hyp": os.path.join(opt.root, "data/hyps/hyp.scratch-low.yaml"),
    },
    "yolov5s": {
        "weights": os.path.join(opt.root, "weights/yolov5s.pt"),
        "cfg": os.path.join(opt.root, "models/yolov5s.yaml"),
        "hyp": os.path.join(opt.root, "data/hyps/hyp.scratch-low.yaml"),
    },
    "yolov5m": {
        "weights": os.path.join(opt.root, "weights/yolov5m.pt"),
        "cfg": os.path.join(opt.root, "models/yolov5m.yaml"),
        "hyp": os.path.join(opt.root, "data/hyps/hyp.scratch-med.yaml"),
    },
    "yolov5x": {
        "weights": os.path.join(opt.root, "weights/yolov5x.pt"),
        "cfg": os.path.join(opt.root, "models/yolov5x.yaml"),
        "hyp": os.path.join(opt.root, "data/hyps/hyp.scratch-med.yaml"),
    },
    "yolov5l": {
        "weights": os.path.join(opt.root, "weights/yolov5l.pt"),
        "cfg": os.path.join(opt.root, "models/yolov5l.yaml"),
        "hyp": os.path.join(opt.root, "data/hyps/hyp.scratch-high.yaml"),
    }
}
