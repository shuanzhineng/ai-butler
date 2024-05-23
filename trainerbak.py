# -*- coding:UTF-8 -*-
from config import opt, TrainParams, MODEL_NAME_TRAIN_DICT
import os.path
import shutil
from utils.general import LOGGER, increment_path,set_logging  # run before defining LOGGER
from train_company import main
from utils.datasetpre import PrepareDataset
from utils.yamlconfig import (HypScratch, HypScratchLow, HypScratchMed, HypScratchHigh, COCO128)
from utils.zipfolder import zip_folder, move_zipfile
from loguru import logger
import yaml
import time
from pathlib import Path


class Trainer:

    def __init__(
            self,
            task_id: str,
            imgs_dir: str,
            xmls_dir: str,
            coco_dir: str,
            output_dir: str,
            train_hyp_params: dict,
            train_params: dict,
            model_name: str = "yolov5s",
            train_data_ratio: float = 0.8,
            second_train: bool = True,

    ):
        
        opt.train_log_name = f"train_log_{task_id}.log"
        opt.train_log_path = os.path.join(opt.train_log_dir, opt.train_log_name)
        set_logging(train_log_path=opt.train_log_path)
        self.task_id = task_id
        self.imgs_dir = imgs_dir
        self.xmls_dir = xmls_dir

        # 数据集预处理
        self.pre_dataset = PrepareDataset(
            imgs_dir=imgs_dir,
            xmls_dir=xmls_dir,
            coco_dir=coco_dir,
            img_type="jpg" or "png" or "jpeg" or "webp",
            is_move=False,
            train_ratio=train_data_ratio,
            class_names=[],
            train_task_id=task_id,
            train_task_root_dir=output_dir,
        )
        # 根据参数生成coco128.yaml
        self.coco128 = COCO128()
        # self.train_hyp_params = train_hyp_params  # 需要对传入的参数字典进行解析
        self.model_name = model_name
        # 配置训练超参数
        if len(train_hyp_params.keys()) != 0:  # 高阶用法，用户自己选用超参数
            self.hyp_scratch = HypScratch(**train_hyp_params)
            # 根据用户输入的参数，生成yaml,返回路径
        self.hyp_scratch = None
        # self.hyp_scratch_low = HypScratchLow()
        # self.hyp_scratch_med = HypScratchMed()
        # self.hyp_scratch_high = HypScratchHigh()

        # 配置训练参数
        self.train_params = TrainParams(**train_params)  # 这里的参数只有部分，可以先填写
        self.coco_dir = coco_dir
        self.output_dir = output_dir
        self.class_names = self.pre_dataset.class_names
        self.train_ratio = train_data_ratio

        self.sign = int(time.time())

        self.coco128_name = None
        self.second_train = second_train
        self.output_filename = self.task_id + "_" + str(self.sign) + "_runs#train" + ".zip"

    @staticmethod
    def read_yaml(yaml_file: str = "data/coco128.yaml"):
        with open(yaml_file, encoding="ascii", errors="ignore") as f:
            yaml_result = yaml.safe_load(f)
        return yaml_result

    def write_yaml(self, yaml_file: str = "data/coco128_2.yaml"):
        with open(yaml_file, "w") as f:
            yaml.safe_dump(self.coco128.dict(), f, default_flow_style=False)

    @staticmethod
    def copy_file(file_full_path: str, destination):
        # 压缩训练后的文件到指定的目录
        os.makedirs(destination, exist_ok=True)
        shutil.copy(file_full_path, destination)

    @staticmethod
    def remove_file(file_full_path):
        try:
            os.remove(file_full_path)
            LOGGER.info(f"文件 {file_full_path} 已被成功删除")
        except OSError as e:
            LOGGER.error(f"删除文件时发生错误: {file_full_path} : {e.strerror}")

    @staticmethod
    def rmtree_dir(dir_path):
        # 使用shutil.rmtree()删除文件夹及其内容

        try:
            shutil.rmtree(dir_path)
            LOGGER.info(f"文件夹 {dir_path} 及其内容已被成功删除")
        except OSError as e:
            LOGGER.error(f"删除文件夹时发生错误: {dir_path} : {e.strerror}")

    def prepare_dataset(self):
        """训练数据准备"""
        self.pre_dataset()  # 所有的路径都已经填充好
        LOGGER.info(f"prepare_dataset finished.")

    def prepare_coco128(self):
        self.coco128.train = os.path.join(self.coco_dir, "images/train")
        self.coco128.val = os.path.join(self.coco_dir, "images/val")
        self.coco128.nc = len(self.class_names)
        self.coco128.names = self.class_names
        # 生成coco128.yaml文件
        self.coco128_name = os.path.join(opt.root, f"data/coco128_{self.sign}.yaml")
        self.write_yaml(yaml_file=self.coco128_name)
        LOGGER.info(f"prepare_coco128 finished.")
        return self.coco128_name

    def prepare_train_params(self):
        # 解析训练参数,写出yaml，并且给训练赋值
        # 1. 假设只输入模型名称,不用生成yaml
        model_get = MODEL_NAME_TRAIN_DICT.get(self.model_name)
        self.train_params.weights = model_get.get("weights")
        self.train_params.cfg = model_get.get("cfg")
        self.train_params.hyp = model_get.get("hyp")
        self.train_params.save_dir = increment_path(
            Path(os.path.join(opt.root, self.train_params.project)) / self.train_params.name,
            exist_ok=False,
            mkdir=True
        )
        # todo 根据用户输入，生成超参数, 并返回文件全路径

        # 生成coco128.yaml
        self.prepare_coco128()
        self.train_params.data = self.coco128_name
        LOGGER.info(f"prepare_train_params finished.")

    def train(self):
        if not self.second_train:
            self.prepare_dataset()
        self.prepare_coco128()
        self.prepare_train_params()

        # 开启训练
        main(self.train_params)
        log_dir = self.train_params.save_dir
        # 压缩日志路径
        # 把trian_log.log移动到runs/train/expx中，然后压缩runs/train/expx
        # print(opt.train_log_path)
        # print(os.path.join(opt.root, log_dir))
        LOGGER.info(f"logdir: {log_dir}")
        self.copy_file(opt.train_log_path, os.path.join(opt.root, log_dir))
        self.copy_file(self.train_params.data, os.path.join(opt.root, log_dir))
        self.copy_file(os.path.join(opt.root, "label_list.txt"), os.path.join(opt.root, log_dir))

        output_path = os.path.join(self.output_dir, self.output_filename)
        zip_folder(log_dir, output_filename=output_path)
        LOGGER.info(f"zip_folder saved to {output_path}")

        return log_dir

    def delete(self):
        # self.rmtree_dir(opt.train_log_dir)
        self.remove_file(self.train_params.data)
        self.rmtree_dir(self.train_params.save_dir)
        logger.info("ENDING........................................................................")


if __name__ == '__main__':
    train_hyp_params = {
        "lr0": 0.01,  # initial learning rate (SGD=1E-2, Adam=1E-3)
        "lrf": 0.01,  # final OneCycleLR learning rate (lr0 * lrf)
        "momentum": 0.937,  # SGD momentum/Adam beta1
        "weight_decay": 0.0005,  # optimizer weight decay 5e-4
        "warmup_epochs": 3.0,  # warmup epochs (fractions ok)
        "warmup_momentum": 0.8,  # warmup initial momentum
        "warmup_bias_lr": 0.1,  # warmup initial bias lr
        "box": 0.05,  # box loss gain
        "cls": 0.5,  # cls loss gain
        "cls_pw": 1.0,  # cls BCELoss positive_weight
        "obj": 1.0,  # obj loss gain (scale with pixels)
        "obj_pw": 1.0,  # obj BCELoss positive_weight
        "iou_t": 0.20,  # IoU training threshold
        "anchor_t": 4.0,  # anchor-multiple threshold
        # anchors: 3  # anchors per output layer (0 to ignore)
        "fl_gamma": 0.0,  # focal loss gamma (efficientDet default gamma=1.5)
        "hsv_h": 0.015,  # image HSV-Hue augmentation (fraction)
        "hsv_s": 0.7,  # image HSV-Saturation augmentation (fraction)
        "hsv_v": 0.4,  # image HSV-Value augmentation (fraction)
        "degrees": 0.0,  # image rotation (+/- deg)
        "translate": 0.1,  # image translation (+/- fraction)
        "scale": 0.5,  # image scale (+/- gain)
        "shear": 0.0,  # image shear (+/- deg)
        "perspective": 0.0,  # image perspective (+/- fraction), range 0-0.001
        "flipud": 0.0,  # image flip up-down (probability)
        "fliplr": 0.5,  # image flip left-right (probability)
        "mosaic": 1.0,  # image mosaic (probability)
        "mixup": 0.0,  # image mixup (probability)
        "copy_paste": 0.0,  # segment copy-paste (probability)
    }

    task_id = "task_"+ "123456"
    imgs_dir = r"/data/home/lizhiyong/dataset/plateform/closeye_dataset/images"
    xmls_dir = r"/data/home/lizhiyong/dataset/plateform/closeye_dataset/xmls"
    coco_dir = r"/data/home/lizhiyong/dataset/plateform/coco_closeye"
    output_dir = "/data/home/lizhiyong/dataset/plateform/task_coco_closeye"
    # train_hyp_params = dict()
    # train_params = dict()
    model_name: str = "yolov5n"
    train_data_ratio: float = 0.8
    # print(train_params.get("mixup"))
    train_params = {
        "epochs": 1,
        "batch_size": 16,
        "imgsz": 224,
        # "rect": False,
        # "resume": False,
        # "nosave": False,
        # "noval": False,
        # "noautoanchor": False,
        # "noplots": False,
        # "evolve": False,
        # "bucket": "",
        # "cache": None,
        # "image_weights": False,
        "device": "0",
        "multi_scale": False,
        # "single_cls": False,
        "optimizer": "SGD",
        "sync_bn": False,
        "workers": 0,
        "cos_lr": False,
        "label_smoothing": 0.0,
        "freeze": [0],
        "save_period": -1,
        "seed": 0,
        "local_rank": -1
    }

    trainer = Trainer(
        task_id=task_id,
        imgs_dir=imgs_dir,
        xmls_dir=xmls_dir,
        coco_dir=coco_dir,
        output_dir=output_dir,
        train_hyp_params={},
        train_params=train_params,
        model_name=model_name,
        train_data_ratio=0.8,
        second_train=False
    )
    trainer.train()
    trainer.delete()
